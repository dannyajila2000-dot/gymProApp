import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { AdminProClient, AdminProNoDisponible, AdminProRechazo } from './adminpro.client.js'

/**
 * Manda a AdminPro el peso que el socio registra en la app (con su estatura), para que el entrenador lo vea en la
 * ficha de mediciones. Solo para socios enlazados. Si AdminPro no responde, el registro queda pendiente
 * (`adminSincronizadoEn` vacío) y se reenvía la próxima vez; AdminPro no duplica porque identifica cada medición
 * por el id del registro.
 */
@Injectable()
export class MedicionesAdminService {
  private readonly logger = new Logger(MedicionesAdminService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminpro: AdminProClient,
  ) {}

  /** Envía los pesos pendientes. Nunca lanza: lo que falle se queda para el próximo intento. */
  async enviarPendientes(clienteId: string): Promise<void> {
    try {
      if (!this.adminpro.disponible()) return
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { adminClienteId: true, alturaCm: true, gimnasio: { select: { adminIntegrado: true } } },
      })
      // AdminPro exige peso y estatura juntos: sin estatura se espera a que el socio la registre.
      if (!cliente?.adminClienteId || !cliente.gimnasio.adminIntegrado || !cliente.alturaCm) return

      const pendientes = await this.prisma.registroProgreso.findMany({
        where: { clienteId, pesoKg: { not: null }, adminSincronizadoEn: null },
        orderBy: { fecha: 'asc' },
        take: 20,
      })

      for (const registro of pendientes) {
        try {
          await this.adminpro.enviarMedicion(cliente.adminClienteId, {
            origenId: registro.id,
            fecha: registro.fecha.toISOString(),
            peso: registro.pesoKg!,
            talla: cliente.alturaCm,
          })
        } catch (e) {
          if (e instanceof AdminProNoDisponible) return // se reintenta la próxima vez
          if (!(e instanceof AdminProRechazo)) throw e
          // AdminPro rechazó este dato (por ejemplo, un valor fuera de rango): se deja de reintentar para que no
          // bloquee a los demás.
          this.logger.warn(`AdminPro rechazó una medición del socio ${clienteId}: ${e.message}`)
        }
        await this.prisma.registroProgreso.update({ where: { id: registro.id }, data: { adminSincronizadoEn: new Date() } })
      }
    } catch (e) {
      this.logger.warn(`No se pudieron enviar las mediciones del socio ${clienteId}: ${(e as Error).message}`)
    }
  }
}
