import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service.js'

type RutinaConEjercicios = Prisma.RutinaGetPayload<{
  include: { ejercicios: { include: { ejercicio: true } } }
}>
type RutinaEjercicioConEjercicio = RutinaConEjercicios['ejercicios'][number]
type PerfilCliente = { nivelFitness: string | null; restriccionFisica: string | null }

@Injectable()
export class RutinasService {
  constructor(private readonly prisma: PrismaService) {}

  listarDisponibles(gimnasioId: string) {
    return this.prisma.rutina.findMany({
      where: { gimnasioId, activa: true },
      include: { ejercicios: { include: { ejercicio: true }, orderBy: { orden: 'asc' } } },
      orderBy: { creadoEn: 'desc' },
    })
  }

  async miRutina(clienteId: string) {
    const [asignacion, cliente] = await Promise.all([
      this.prisma.clienteRutina.findFirst({
        where: { clienteId, activa: true },
        orderBy: { fechaInicio: 'desc' },
        include: {
          rutina: {
            include: { ejercicios: { include: { ejercicio: true }, orderBy: { orden: 'asc' } } },
          },
        },
      }),
      this.prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { nivelFitness: true, restriccionFisica: true },
      }),
    ])
    if (!asignacion) return null

    const sustituciones = await this.prisma.sustitucionEjercicio.findMany({
      where: { clienteId, rutinaEjercicio: { rutinaId: asignacion.rutinaId } },
      include: { ejercicioSustituto: true },
    })
    const mapaSustituciones = new Map(sustituciones.map((s) => [s.rutinaEjercicioId, s.ejercicioSustituto]))

    return this.personalizar(asignacion.rutina, cliente, mapaSustituciones)
  }

  /**
   * Adapta la rutina (plantilla compartida del gimnasio) al cliente:
   * - Quita o sustituye ejercicios inseguros según su restricción física.
   * - Escala series/descanso según su nivel de fitness.
   * No modifica la plantilla original en la base de datos.
   */
  private async personalizar(
    rutina: RutinaConEjercicios,
    cliente: PerfilCliente | null,
    sustituciones: Map<string, RutinaEjercicioConEjercicio['ejercicio']> = new Map(),
  ) {
    if (!cliente?.nivelFitness && !cliente?.restriccionFisica && sustituciones.size === 0) return rutina

    const restriccion = cliente?.restriccionFisica ?? null
    const idsEnRutina = new Set(rutina.ejercicios.map((re) => re.ejercicioId))
    const gruposConProblema = new Set(
      rutina.ejercicios.filter((re) => this.esInseguro(re.ejercicio, restriccion)).map((re) => re.ejercicio.grupoMuscular),
    )

    const alternativas = gruposConProblema.size
      ? await this.prisma.ejercicio.findMany({
          where: {
            grupoMuscular: { in: [...gruposConProblema] },
            id: { notIn: [...idsEnRutina] },
            esAltoImpacto: false,
            requiereSaltos: false,
          },
        })
      : []
    const alternativaPorGrupo = new Map<string, (typeof alternativas)[number]>()
    for (const alternativa of alternativas) {
      if (!alternativaPorGrupo.has(alternativa.grupoMuscular)) {
        alternativaPorGrupo.set(alternativa.grupoMuscular, alternativa)
      }
    }

    const ejerciciosPersonalizados = rutina.ejercicios
      .map((re) => {
        let itemFinal: RutinaEjercicioConEjercicio = re
        const sustituto = sustituciones.get(re.id)
        if (sustituto && !this.esInseguro(sustituto, restriccion)) {
          itemFinal = { ...re, ejercicio: sustituto, ejercicioId: sustituto.id }
        } else if (this.esInseguro(itemFinal.ejercicio, restriccion)) {
          const alternativa = alternativaPorGrupo.get(re.ejercicio.grupoMuscular)
          if (!alternativa) return null
          itemFinal = { ...re, ejercicio: alternativa, ejercicioId: alternativa.id }
        }
        return this.escalarVolumen(itemFinal, cliente?.nivelFitness ?? null)
      })
      .filter((item): item is RutinaEjercicioConEjercicio => item !== null)

    return { ...rutina, ejercicios: ejerciciosPersonalizados }
  }

  private esInseguro(
    ejercicio: { esAltoImpacto: boolean; requiereSaltos: boolean },
    restriccion: string | null,
  ) {
    if (restriccion === 'impacto_bajo') return ejercicio.esAltoImpacto
    if (restriccion === 'sin_saltos') return ejercicio.requiereSaltos
    return false
  }

  private escalarVolumen(item: RutinaEjercicioConEjercicio, nivelFitness: string | null): RutinaEjercicioConEjercicio {
    const factorSeries = nivelFitness === 'principiante' ? 0.8 : nivelFitness === 'avanzado' ? 1.2 : 1
    const factorDescanso = nivelFitness === 'principiante' ? 1.3 : nivelFitness === 'avanzado' ? 0.8 : 1
    return {
      ...item,
      series: item.series ? Math.max(1, Math.round(item.series * factorSeries)) : item.series,
      descansoSeg: item.descansoSeg ? Math.round(item.descansoSeg * factorDescanso) : item.descansoSeg,
    }
  }

  async asignarme(clienteId: string, gimnasioId: string, rutinaId: string) {
    const rutina = await this.prisma.rutina.findFirst({
      where: { id: rutinaId, gimnasioId, activa: true },
    })
    if (!rutina) throw new NotFoundException('Rutina no encontrada')

    return this.asignar(clienteId, rutina.id, 'auto')
  }

  private async asignar(clienteId: string, rutinaId: string, asignadaPor: string) {
    await this.prisma.clienteRutina.updateMany({
      where: { clienteId, activa: true },
      data: { activa: false },
    })

    return this.prisma.clienteRutina.create({
      data: { clienteId, rutinaId, asignadaPor },
    })
  }

  /**
   * Elige la rutina activa del gimnasio que mejor combine con el nivel y el
   * objetivo calculado en el onboarding, y se la asigna al cliente. Si no hay
   * una combinación exacta, relaja primero el objetivo y luego el nivel.
   */
  async asignarMejorParaCliente(
    clienteId: string,
    gimnasioId: string,
    nivel: string,
    objetivo: string,
  ) {
    const candidatas = [
      { gimnasioId, activa: true, nivel, objetivo },
      { gimnasioId, activa: true, nivel },
      { gimnasioId, activa: true },
    ]

    let rutina = null
    for (const where of candidatas) {
      rutina = await this.prisma.rutina.findFirst({ where, orderBy: { creadoEn: 'desc' } })
      if (rutina) break
    }
    if (!rutina) return null

    await this.asignar(clienteId, rutina.id, 'auto-onboarding')
    return rutina
  }

  async registrarSesion(
    clienteId: string,
    gimnasioId: string,
    datos: { rutinaId: string; duracionMin: number; caloriasEstimadas: number },
  ) {
    const rutina = await this.prisma.rutina.findFirst({
      where: { id: datos.rutinaId, gimnasioId },
    })
    if (!rutina) throw new NotFoundException('Rutina no encontrada')

    return this.prisma.sesionEntrenamiento.create({
      data: {
        clienteId,
        rutinaId: datos.rutinaId,
        duracionMin: datos.duracionMin,
        caloriasEstimadas: datos.caloriasEstimadas,
      },
    })
  }

  historial(clienteId: string) {
    return this.prisma.sesionEntrenamiento.findMany({
      where: { clienteId },
      include: { rutina: true },
      orderBy: { completadaEn: 'desc' },
      take: 60,
    })
  }

  async alternativasParaEjercicio(clienteId: string, gimnasioId: string, rutinaEjercicioId: string) {
    const rutinaEjercicio = await this.prisma.rutinaEjercicio.findFirst({
      where: { id: rutinaEjercicioId, rutina: { gimnasioId } },
      include: { ejercicio: true },
    })
    if (!rutinaEjercicio) throw new NotFoundException('Ejercicio no encontrado')

    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { restriccionFisica: true },
    })
    const restriccion = cliente?.restriccionFisica ?? null

    return this.prisma.ejercicio.findMany({
      where: {
        grupoMuscular: rutinaEjercicio.ejercicio.grupoMuscular,
        id: { not: rutinaEjercicio.ejercicioId },
        ...(restriccion === 'impacto_bajo' ? { esAltoImpacto: false } : {}),
        ...(restriccion === 'sin_saltos' ? { requiereSaltos: false } : {}),
      },
      orderBy: { nombre: 'asc' },
    })
  }

  async sustituirEjercicio(clienteId: string, gimnasioId: string, rutinaEjercicioId: string, ejercicioId: string) {
    const rutinaEjercicio = await this.prisma.rutinaEjercicio.findFirst({
      where: { id: rutinaEjercicioId, rutina: { gimnasioId } },
    })
    if (!rutinaEjercicio) throw new NotFoundException('Ejercicio no encontrado')

    return this.prisma.sustitucionEjercicio.upsert({
      where: { clienteId_rutinaEjercicioId: { clienteId, rutinaEjercicioId } },
      create: { clienteId, rutinaEjercicioId, ejercicioId },
      update: { ejercicioId },
    })
  }

  async quitarSustitucion(clienteId: string, rutinaEjercicioId: string) {
    await this.prisma.sustitucionEjercicio.deleteMany({ where: { clienteId, rutinaEjercicioId } })
  }
}
