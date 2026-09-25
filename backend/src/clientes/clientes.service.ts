import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { RutinasService } from '../rutinas/rutinas.service.js'
import { OnboardingDto } from './dto/onboarding.dto.js'
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js'

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
  ) {}

  async completarOnboarding(clienteId: string, gimnasioId: string, dto: OnboardingDto) {
    const objetivo = calcularObjetivo(dto.pesoActualKg, dto.pesoObjetivoKg)

    await this.prisma.$transaction([
      this.prisma.cliente.update({
        where: { id: clienteId },
        data: {
          alturaCm: dto.alturaCm,
          nivelFitness: dto.nivelFitness,
          nivelActividad: dto.nivelActividad,
          pesoObjetivoKg: dto.pesoObjetivoKg,
          restriccionFisica: dto.restriccionFisica,
          onboardingCompletado: true,
        },
      }),
      this.prisma.registroProgreso.create({
        data: { clienteId, pesoKg: dto.pesoActualKg },
      }),
      ...(dto.horaRecordatorio
        ? [
            this.prisma.recordatorio.create({
              data: { clienteId, hora: dto.horaRecordatorio, diasSemana: [0, 1, 2, 3, 4, 5, 6] },
            }),
          ]
        : []),
    ])

    const rutinaAsignada = await this.rutinasService.asignarMejorParaCliente(
      clienteId,
      gimnasioId,
      dto.nivelFitness,
      objetivo,
    )

    return {
      objetivoCalculado: objetivo,
      rutinaAsignada: rutinaAsignada
        ? { id: rutinaAsignada.id, nombre: rutinaAsignada.nombre }
        : null,
    }
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

    const objetivo = calcularObjetivo(ultimoRegistro.pesoKg, cliente.pesoObjetivoKg, ultimoRegistro.grasaCorporalPct)

    const rutinaAsignada = await this.rutinasService.asignarMejorParaCliente(
      clienteId,
      gimnasioId,
      cliente.nivelFitness,
      objetivo,
    )

    return {
      objetivoCalculado: objetivo,
      rutinaAsignada: rutinaAsignada
        ? { id: rutinaAsignada.id, nombre: rutinaAsignada.nombre }
        : null,
    }
  }

  actualizarPerfil(clienteId: string, dto: ActualizarPerfilDto) {
    return this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        telefono: dto.telefono,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
        unidadPeso: dto.unidadPeso,
        unidadAltura: dto.unidadAltura,
        restriccionFisica: dto.restriccionFisica,
        preferenciaEntrenador: dto.preferenciaEntrenador,
        guiaDeVozActiva: dto.guiaDeVozActiva,
        cuentaAtrasSeg: dto.cuentaAtrasSeg,
        volumenMusica: dto.volumenMusica,
        bajarVolumenConVoz: dto.bajarVolumenConVoz,
      },
    })
  }
}
