import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { MedicionesAdminService } from '../integracion/mediciones-admin.service.js'
import { RutinasService } from '../rutinas/rutinas.service.js'
import { OnboardingDto } from './dto/onboarding.dto.js'
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js'
import type { PerfilRecomendacion } from '../rutinas/recomendacion.util.js'

const UMBRAL_KG = 1
// Rangos de grasa corporal aproximados y unisex: no pedimos sexo/edad en el
// onboarding, así que solo se usan para desempatar cuando el peso objetivo
// está cerca del actual (recomposición), nunca contradicen una meta de peso clara.
const GRASA_ALTA_PCT = 25
const GRASA_BAJA_PCT = 12

function calcularObjetivo(pesoActualKg: number, pesoObjetivoKg: number, grasaCorporalPct?: number | null): string {
  const diferencia = pesoObjetivoKg - pesoActualKg
  if (diferencia <= -UMBRAL_KG) return 'perdida_grasa'
  if (diferencia >= UMBRAL_KG) return 'fuerza'

  if (grasaCorporalPct != null) {
    if (grasaCorporalPct >= GRASA_ALTA_PCT) return 'perdida_grasa'
    if (grasaCorporalPct < GRASA_BAJA_PCT) return 'fuerza'
  }
  return 'cuerpo_completo'
}

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rutinasService: RutinasService,
    @Optional() private readonly medicionesAdmin?: MedicionesAdminService,
  ) {}

  /** Sedes activas del gimnasio del cliente, para que elija a cuál va. */
  async sucursales(clienteId: string, gimnasioId: string) {
    // Un socio enlazado con AdminPro ya tiene la sucursal que le puso el administrador: no hay nada que elegir.
    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { adminClienteId: true } })
    if (cliente?.adminClienteId) return []

    return this.prisma.sucursal.findMany({
      where: { gimnasioId, activa: true },
      select: { id: true, nombre: true, direccion: true },
      orderBy: { nombre: 'asc' },
    })
  }

  async completarOnboarding(clienteId: string, gimnasioId: string, dto: OnboardingDto) {
    const objetivoPorPeso = calcularObjetivo(dto.pesoActualKg, dto.pesoObjetivoKg)

    if (dto.sucursalId) {
      const sucursal = await this.prisma.sucursal.findFirst({ where: { id: dto.sucursalId, gimnasioId, activa: true } })
      if (!sucursal) throw new NotFoundException('No encontramos esa sucursal')
    }
    // Si el cliente eligió días, esos mandan; el recordatorio (si lo quiere) cae esos mismos días.
    const dias = dto.diasEntrenamiento ? [...dto.diasEntrenamiento].sort((a, b) => a - b) : null
    const horaRecordatorio = dto.horaEntrenamiento
      ? dto.recordarme === false
        ? null
        : dto.horaEntrenamiento
      : (dto.horaRecordatorio ?? null)

    await this.prisma.$transaction([
      this.prisma.cliente.update({
        where: { id: clienteId },
        data: {
          alturaCm: dto.alturaCm,
          nivelFitness: dto.nivelFitness,
          nivelActividad: dto.nivelActividad,
          pesoObjetivoKg: dto.pesoObjetivoKg,
          restriccionFisica: dto.restriccionFisica,
          objetivoPrincipal: dto.objetivoPrincipal,
          historialEntrenamiento: dto.historialEntrenamiento,
          frecuenciaSemanal: dto.frecuenciaSemanal ?? dias?.length,
          horaEntrenamiento: dto.horaEntrenamiento,
          zonasLesion: dto.zonasLesion ?? [],
          sucursalId: dto.sucursalId,
          ...(dias ? { diasEntrenamientoSemana: dias } : {}),
          onboardingCompletado: true,
        },
      }),
      this.prisma.registroProgreso.create({
        data: { clienteId, pesoKg: dto.pesoActualKg },
      }),
      ...(horaRecordatorio
        ? [
            this.prisma.recordatorio.create({
              data: { clienteId, hora: horaRecordatorio, diasSemana: dias ?? [0, 1, 2, 3, 4, 5, 6] },
            }),
          ]
        : []),
    ])

    // El peso y la estatura del onboarding también llegan a la ficha del socio en AdminPro.
    void this.medicionesAdmin?.enviarPendientes(clienteId)

    return this.recomendarYAsignar(
      clienteId,
      gimnasioId,
      {
        nivelFitness: dto.nivelFitness,
        objetivoPrincipal: dto.objetivoPrincipal,
        objetivoPorPeso,
        historialEntrenamiento: dto.historialEntrenamiento,
        frecuenciaSemanal: dto.frecuenciaSemanal ?? dias?.length,
        zonasLesion: dto.zonasLesion ?? [],
        restriccionFisica: dto.restriccionFisica,
      },
      'auto-onboarding',
    )
  }

  /**
   * Calcula las mejores rutinas del gimnasio para el perfil y deja asignada la primera (el cliente puede
   * elegir otra de las recomendadas después). Si el gimnasio no tiene ninguna adecuada, usa la
   * asignación anterior por nivel y objetivo.
   */
  private async recomendarYAsignar(clienteId: string, gimnasioId: string, perfil: PerfilRecomendacion, origen: string) {
    const recomendaciones = await this.rutinasService.recomendarParaPerfil(perfil, gimnasioId)

    let rutinaAsignada: { id: string; nombre: string } | null = null
    if (recomendaciones.length) {
      await this.rutinasService.asignarElegida(clienteId, recomendaciones[0].rutinaId, origen)
      rutinaAsignada = { id: recomendaciones[0].rutinaId, nombre: recomendaciones[0].nombre }
    } else {
      const respaldo = await this.rutinasService.asignarMejorParaCliente(
        clienteId,
        gimnasioId,
        perfil.nivelFitness,
        perfil.objetivoPorPeso,
      )
      rutinaAsignada = respaldo ? { id: respaldo.id, nombre: respaldo.nombre } : null
    }

    return { objetivoCalculado: perfil.objetivoPorPeso, rutinaAsignada, recomendaciones }
  }

  /**
   * Vuelve a calcular el objetivo y reasignar la rutina con los datos más
   * recientes del cliente (por ejemplo después de registrar un nuevo peso o
   * % de grasa corporal en Progreso). No repite el onboarding completo.
   */
  async recalcularRutina(clienteId: string, gimnasioId: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId } })
    if (!cliente?.nivelFitness || cliente.pesoObjetivoKg == null) {
      throw new BadRequestException('Completa primero el registro inicial (onboarding)')
    }

    const ultimoRegistro = await this.prisma.registroProgreso.findFirst({
      where: { clienteId, pesoKg: { not: null } },
      orderBy: { fecha: 'desc' },
    })
    if (!ultimoRegistro?.pesoKg) {
      throw new BadRequestException('Registra tu peso actual en Progreso antes de recalcular')
    }

    const objetivoPorPeso = calcularObjetivo(ultimoRegistro.pesoKg, cliente.pesoObjetivoKg, ultimoRegistro.grasaCorporalPct)

    return this.recomendarYAsignar(
      clienteId,
      gimnasioId,
      {
        nivelFitness: cliente.nivelFitness,
        objetivoPrincipal: cliente.objetivoPrincipal,
        objetivoPorPeso,
        historialEntrenamiento: cliente.historialEntrenamiento,
        frecuenciaSemanal: cliente.frecuenciaSemanal,
        zonasLesion: cliente.zonasLesion,
        restriccionFisica: cliente.restriccionFisica,
      },
      'auto',
    )
  }

  async actualizarPerfil(clienteId: string, dto: ActualizarPerfilDto) {
    // En los socios enlazados con AdminPro, el nombre y el teléfono los manda el gimnasio: aquí no se editan.
    const enlazado = await this.prisma.cliente.findUnique({ where: { id: clienteId }, select: { adminClienteId: true } })
    const delGimnasio = !!enlazado?.adminClienteId
    return this.prisma.cliente.update({
      where: { id: clienteId },
      // Nunca devolver el hash de la contraseña en la respuesta.
      omit: { passwordHash: true },
      data: {
        nombres: delGimnasio ? undefined : dto.nombres,
        apellidos: delGimnasio ? undefined : dto.apellidos,
        telefono: delGimnasio ? undefined : dto.telefono,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
        unidadPeso: dto.unidadPeso,
        unidadAltura: dto.unidadAltura,
        restriccionFisica: dto.restriccionFisica,
        preferenciaEntrenador: dto.preferenciaEntrenador,
        guiaDeVozActiva: dto.guiaDeVozActiva,
        cuentaAtrasSeg: dto.cuentaAtrasSeg,
        volumenMusica: dto.volumenMusica,
        bajarVolumenConVoz: dto.bajarVolumenConVoz,
        diasEntrenamientoSemana: dto.diasEntrenamientoSemana,
        calentamientoActivo: dto.calentamientoActivo,
      },
    })
  }
}
