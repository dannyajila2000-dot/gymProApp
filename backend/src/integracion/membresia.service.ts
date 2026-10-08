import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { AdminProClient, AdminProRechazo, TIMEOUT_REFRESCO_MS, type FichaSocioAdmin } from './adminpro.client.js'

// Cuánto se confía en lo sincronizado antes de volver a preguntarle a AdminPro.
const CACHE_POR_DEFECTO_MS = 5 * 60_000

@Injectable()
export class MembresiaService {
  private readonly logger = new Logger(MembresiaService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminpro: AdminProClient,
  ) {}

  /** Crea o actualiza la sucursal que viene de AdminPro (nombre y dirección) y devuelve su id local. */
  async sucursalDeFicha(gimnasioId: string, sucursal: NonNullable<FichaSocioAdmin['sucursal']>): Promise<string> {
    const datos = { nombre: sucursal.nombre, direccion: sucursal.direccion ?? null }
    const local = await this.prisma.sucursal.upsert({
      where: { adminSucursalId: sucursal.id },
      create: { gimnasioId, adminSucursalId: sucursal.id, ...datos },
      update: datos,
    })
    return local.id
  }

  /**
   * Guarda en el socio lo que AdminPro dice de él. AdminPro manda en su nombre, teléfono y sucursal (el correo no se
   * toca: es con el que inicia sesión), y en la membresía.
   */
  async aplicarFicha(clienteId: string, ficha: FichaSocioAdmin) {
    const actual = await this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { gimnasioId: true } })
    const sucursalId = actual && ficha.sucursal ? await this.sucursalDeFicha(actual.gimnasioId, ficha.sucursal) : undefined
    return this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        nombres: ficha.nombres || undefined,
        apellidos: ficha.apellidos || undefined,
        telefono: ficha.telefono,
        sucursalId,
        // Si en AdminPro dieron de baja al socio, aquí también deja de poder entrar.
        activo: ficha.activo,
        membresiaEstado: ficha.membresia.estado,
        membresiaPlan: ficha.membresia.plan,
        membresiaDuracionDias: ficha.membresia.duracionDias ?? null,
        membresiaVenceEn: ficha.membresia.fechaVencimiento ? new Date(ficha.membresia.fechaVencimiento) : null,
        membresiaSincronizadaEn: new Date(),
      },
    })
  }

  /**
   * Refresca la membresía del socio desde AdminPro, si hace falta. Devuelve true si consultó y actualizó.
   * Si AdminPro no responde no pasa nada: se queda el último estado sincronizado (no se bloquea a nadie por una caída).
   */
  async sincronizar(clienteId: string, opciones: { cacheMs?: number; timeoutMs?: number } = {}): Promise<boolean> {
    const { cacheMs = CACHE_POR_DEFECTO_MS, timeoutMs = TIMEOUT_REFRESCO_MS } = opciones
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { adminClienteId: true, membresiaSincronizadaEn: true, gimnasio: { select: { adminIntegrado: true } } },
    })
    if (!cliente?.adminClienteId || !cliente.gimnasio.adminIntegrado || !this.adminpro.disponible()) return false
    if (cliente.membresiaSincronizadaEn && Date.now() - cliente.membresiaSincronizadaEn.getTime() < cacheMs) return false

    try {
      await this.aplicarFicha(clienteId, await this.adminpro.estadoSocio(cliente.adminClienteId, timeoutMs))
      return true
    } catch (e) {
      if (e instanceof AdminProRechazo && e.status === 404) {
        // Borraron al socio en AdminPro.
        await this.prisma.cliente.update({ where: { id: clienteId }, data: { activo: false } })
        return true
      }
      this.logger.warn(`No se pudo actualizar la membresía de ${clienteId}: ${(e as Error).message}`)
      return false
    }
  }
}
