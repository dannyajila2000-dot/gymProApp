import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  fechaDeHoyEcuador,
  fechaEcuadorDeFecha,
  inicioYFinDeLaSemanaEcuador,
} from '../common/fecha-ecuador.util.js'

type RutinaConEjercicios = Prisma.RutinaGetPayload<{
  include: { ejercicios: { include: { ejercicio: true } } }
}>
type RutinaEjercicioConEjercicio = RutinaConEjercicios['ejercicios'][number]
type PerfilCliente = { nivelFitness: string | null; restriccionFisica: string | null }

/** Misma fórmula que `duracionEstimadaMin` en mobile/src/lib/rutina-utils.ts. */
function duracionEstimadaMin(rutina: RutinaConEjercicios): number {
  const segundos = rutina.ejercicios.reduce((suma, item) => {
    const trabajo = item.duracionSeg ?? (item.repeticiones ?? 10) * 3
    const series = item.series ?? 1
    return suma + trabajo * series + (item.descansoSeg ?? 20) * series
  }, 0)
  return Math.max(1, Math.round(segundos / 60))
}

/** Misma fórmula que `caloriasEstimadas` en mobile/src/lib/rutina-utils.ts. */
function caloriasEstimadasDeRutina(rutina: RutinaConEjercicios): number {
  const calorias = rutina.ejercicios.reduce((suma, item) => {
    const minutos = item.duracionSeg
      ? (item.duracionSeg * (item.series ?? 1)) / 60
      : ((item.repeticiones ?? 10) * (item.series ?? 1) * 3) / 60
    return suma + minutos * (item.ejercicio.caloriasPorMinuto ?? 6)
  }, 0)
  return Math.round(calorias)
}

@Injectable()
export class RutinasService {
  constructor(private readonly prisma: PrismaService) {}

  listarDisponibles(gimnasioId: string) {
    return this.prisma.rutina.findMany({
      where: { gimnasioId, activa: true, creadaPorClienteId: null },
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
      where: {
        id: rutinaId,
        gimnasioId,
        activa: true,
        OR: [{ creadaPorClienteId: null }, { creadaPorClienteId: clienteId }],
      },
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
      { gimnasioId, activa: true, creadaPorClienteId: null, nivel, objetivo },
      { gimnasioId, activa: true, creadaPorClienteId: null, nivel },
      { gimnasioId, activa: true, creadaPorClienteId: null },
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

  /**
   * Un ejercicio de rutina solo es accesible para sustituir/consultar si
   * pertenece a la rutina propia del cliente o a la que tiene asignada
   * actualmente — nunca a la rutina (personal o no) de otro cliente del
   * mismo gimnasio.
   */
  private async obtenerRutinaEjercicioDelCliente(clienteId: string, gimnasioId: string, rutinaEjercicioId: string) {
    const rutinaEjercicio = await this.prisma.rutinaEjercicio.findFirst({
      where: { id: rutinaEjercicioId, rutina: { gimnasioId } },
      include: { ejercicio: true, rutina: true },
    })
    if (!rutinaEjercicio) throw new NotFoundException('Ejercicio no encontrado')
    if (rutinaEjercicio.rutina.creadaPorClienteId === clienteId) return rutinaEjercicio

    const asignacionActiva = await this.prisma.clienteRutina.findFirst({
      where: { clienteId, rutinaId: rutinaEjercicio.rutinaId, activa: true },
    })
    if (!asignacionActiva) throw new NotFoundException('Ejercicio no encontrado')

    return rutinaEjercicio
  }

  async alternativasParaEjercicio(clienteId: string, gimnasioId: string, rutinaEjercicioId: string) {
    const rutinaEjercicio = await this.obtenerRutinaEjercicioDelCliente(clienteId, gimnasioId, rutinaEjercicioId)

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
    await this.obtenerRutinaEjercicioDelCliente(clienteId, gimnasioId, rutinaEjercicioId)
    const ejercicio = await this.prisma.ejercicio.findUnique({ where: { id: ejercicioId } })
    if (!ejercicio) throw new NotFoundException('Ejercicio sustituto no encontrado')

    return this.prisma.sustitucionEjercicio.upsert({
      where: { clienteId_rutinaEjercicioId: { clienteId, rutinaEjercicioId } },
      create: { clienteId, rutinaEjercicioId, ejercicioId },
      update: { ejercicioId },
    })
  }

  async quitarSustitucion(clienteId: string, gimnasioId: string, rutinaEjercicioId: string) {
    await this.obtenerRutinaEjercicioDelCliente(clienteId, gimnasioId, rutinaEjercicioId)
    await this.prisma.sustitucionEjercicio.deleteMany({ where: { clienteId, rutinaEjercicioId } })
  }

  catalogoEjercicios(grupoMuscular?: string, busqueda?: string) {
    return this.prisma.ejercicio.findMany({
      where: {
        ...(grupoMuscular ? { grupoMuscular } : {}),
        ...(busqueda ? { nombre: { contains: busqueda, mode: 'insensitive' } } : {}),
      },
      orderBy: { nombre: 'asc' },
      take: 100,
    })
  }

  misRutinasPersonales(clienteId: string) {
    return this.prisma.rutina.findMany({
      where: { creadaPorClienteId: clienteId },
      include: { ejercicios: { include: { ejercicio: true }, orderBy: { orden: 'asc' } } },
      orderBy: { creadoEn: 'desc' },
    })
  }

  crearRutinaPersonal(
    clienteId: string,
    gimnasioId: string,
    datos: { nombre: string; nivel?: string; objetivo?: string },
  ) {
    return this.prisma.rutina.create({
      data: {
        gimnasioId,
        creadaPorClienteId: clienteId,
        nombre: datos.nombre,
        nivel: datos.nivel ?? 'intermedio',
        objetivo: datos.objetivo ?? 'cuerpo_completo',
      },
      include: { ejercicios: { include: { ejercicio: true }, orderBy: { orden: 'asc' } } },
    })
  }

  private async obtenerRutinaPropia(clienteId: string, rutinaId: string) {
    const rutina = await this.prisma.rutina.findFirst({ where: { id: rutinaId, creadaPorClienteId: clienteId } })
    if (!rutina) throw new NotFoundException('Rutina no encontrada')
    return rutina
  }

  async actualizarRutinaPersonal(
    clienteId: string,
    rutinaId: string,
    datos: { nombre?: string; nivel?: string; objetivo?: string },
  ) {
    await this.obtenerRutinaPropia(clienteId, rutinaId)
    return this.prisma.rutina.update({
      where: { id: rutinaId },
      data: datos,
      include: { ejercicios: { include: { ejercicio: true }, orderBy: { orden: 'asc' } } },
    })
  }

  async eliminarRutinaPersonal(clienteId: string, rutinaId: string) {
    await this.obtenerRutinaPropia(clienteId, rutinaId)
    await this.prisma.rutina.delete({ where: { id: rutinaId } })
  }

  async agregarEjercicioARutinaPersonal(
    clienteId: string,
    rutinaId: string,
    datos: { ejercicioId: string; series?: number; repeticiones?: number; duracionSeg?: number; descansoSeg?: number },
  ) {
    await this.obtenerRutinaPropia(clienteId, rutinaId)
    const ejercicio = await this.prisma.ejercicio.findUnique({ where: { id: datos.ejercicioId } })
    if (!ejercicio) throw new NotFoundException('Ejercicio no encontrado')

    const ultimo = await this.prisma.rutinaEjercicio.findFirst({
      where: { rutinaId },
      orderBy: { orden: 'desc' },
    })
    return this.prisma.rutinaEjercicio.create({
      data: { rutinaId, orden: (ultimo?.orden ?? 0) + 1, ...datos },
      include: { ejercicio: true },
    })
  }

  private async obtenerEjercicioDeRutinaPropia(clienteId: string, rutinaId: string, rutinaEjercicioId: string) {
    await this.obtenerRutinaPropia(clienteId, rutinaId)
    const item = await this.prisma.rutinaEjercicio.findFirst({ where: { id: rutinaEjercicioId, rutinaId } })
    if (!item) throw new NotFoundException('Ejercicio no encontrado en esta rutina')
    return item
  }

  async actualizarEjercicioDeRutinaPersonal(
    clienteId: string,
    rutinaId: string,
    rutinaEjercicioId: string,
    datos: { series?: number; repeticiones?: number | null; duracionSeg?: number | null; descansoSeg?: number },
  ) {
    await this.obtenerEjercicioDeRutinaPropia(clienteId, rutinaId, rutinaEjercicioId)
    return this.prisma.rutinaEjercicio.update({ where: { id: rutinaEjercicioId }, data: datos, include: { ejercicio: true } })
  }

  async eliminarEjercicioDeRutinaPersonal(clienteId: string, rutinaId: string, rutinaEjercicioId: string) {
    await this.obtenerEjercicioDeRutinaPropia(clienteId, rutinaId, rutinaEjercicioId)
    await this.prisma.rutinaEjercicio.delete({ where: { id: rutinaEjercicioId } })
  }

  async planSemana(clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { diasEntrenamientoSemana: true, nivelFitness: true, creadoEn: true },
    })
    const diasEntrenamientoConfigurados = cliente?.diasEntrenamientoSemana ?? []
    const diasSemanaEntrenamiento = diasEntrenamientoConfigurados.length
      ? [...diasEntrenamientoConfigurados].sort((a, b) => a - b)
      : [0, 1, 2, 3, 4, 5, 6] // sin preferencia configurada: todos los días son de entrenamiento

    const hoy = fechaDeHoyEcuador()
    const { inicio } = inicioYFinDeLaSemanaEcuador(hoy)
    const fechaInicioCliente = cliente?.creadoEn ? fechaEcuadorDeFecha(cliente.creadoEn) : hoy

    const [sesiones, poolRotacion, asignacionActiva] = await Promise.all([
      this.prisma.sesionEntrenamiento.findMany({
        where: { clienteId, completadaEn: { gte: inicio, lte: new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000 - 1) } },
        select: { completadaEn: true, duracionMin: true, caloriasEstimadas: true },
      }),
      this.poolDeRotacion(clienteId, cliente?.nivelFitness ?? null),
      this.prisma.clienteRutina.findFirst({
        where: { clienteId, activa: true },
        orderBy: { fechaInicio: 'desc' },
        select: {
          fechaInicio: true,
          rutina: { include: { ejercicios: { include: { ejercicio: true } } } },
        },
      }),
    ])
    // Si hay varias sesiones el mismo día, se queda la última (no debería pasar
    // en el flujo normal — un solo entrenamiento completado por día).
    const sesionPorFecha = new Map(sesiones.map((s) => [fechaEcuadorDeFecha(s.completadaEn), s]))
    const numeroSemana = Math.floor(inicio.getTime() / (7 * 24 * 60 * 60 * 1000))
    // Si el cliente ya eligió/empezó una rutina hoy (a mano o con "Comenzar"),
    // esa elección manda sobre la sugerencia automática — no la pisamos.
    const rutinaElegidaHoy =
      asignacionActiva && fechaEcuadorDeFecha(asignacionActiva.fechaInicio) === hoy ? asignacionActiva.rutina : null

    const dias = []
    for (let diaSemana = 0; diaSemana < 7; diaSemana++) {
      const fecha = fechaEcuadorDeFecha(new Date(inicio.getTime() + diaSemana * 24 * 60 * 60 * 1000))
      const esDiaEntrenamiento = diasSemanaEntrenamiento.includes(diaSemana)
      const posicionEnSemana = diasSemanaEntrenamiento.indexOf(diaSemana)
      const sugerenciaRotacion =
        esDiaEntrenamiento && poolRotacion.length > 0
          ? poolRotacion[(numeroSemana * diasSemanaEntrenamiento.length + posicionEnSemana) % poolRotacion.length]
          : null
      const rutinaDelDia = fecha === hoy && rutinaElegidaHoy ? rutinaElegidaHoy : sugerenciaRotacion
      const completado = sesionPorFecha.has(fecha)
      const sesionDelDia = sesionPorFecha.get(fecha)
      // Si ya se completó, se muestra lo que de verdad duró/quemó esa sesión;
      // si no, se muestra la estimación calculada a partir de los ejercicios
      // configurados en la rutina (misma fórmula que en el detalle de rutina).
      const duracionMin = sesionDelDia?.duracionMin ?? (rutinaDelDia ? duracionEstimadaMin(rutinaDelDia) : null)
      const caloriasEstimadas =
        sesionDelDia?.caloriasEstimadas ?? (rutinaDelDia ? caloriasEstimadasDeRutina(rutinaDelDia) : null)
      const numeroDia =
        Math.floor((Date.parse(`${fecha}T00:00:00Z`) - Date.parse(`${fechaInicioCliente}T00:00:00Z`)) / 86400000) + 1

      dias.push({
        fecha,
        diaSemana,
        numeroDia: Math.max(1, numeroDia),
        esDiaEntrenamiento,
        completado,
        progresoPct: completado ? 100 : 0,
        esHoy: fecha === hoy,
        rutinaId: rutinaDelDia?.id ?? null,
        rutinaNombre: rutinaDelDia?.nombre ?? null,
        duracionMin,
        caloriasEstimadas: caloriasEstimadas != null ? Math.round(caloriasEstimadas) : null,
      })
    }
    return dias
  }

  /**
   * Conjunto de rutinas entre las que rota el plan semanal: las plantillas
   * del gimnasio que combinan con el nivel del cliente (o todas si ninguna
   * combina) más sus propias rutinas personales. Se ordena de forma estable
   * para que la rotación sea determinística entre llamadas.
   */
  private async poolDeRotacion(clienteId: string, nivelFitness: string | null) {
    const conEjercicios = { ejercicios: { include: { ejercicio: true } } } as const
    const [plantillasNivel, plantillasTodas, personales] = await Promise.all([
      nivelFitness
        ? this.prisma.rutina.findMany({
            where: { creadaPorClienteId: null, activa: true, nivel: nivelFitness },
            include: conEjercicios,
            orderBy: { id: 'asc' },
          })
        : Promise.resolve([]),
      this.prisma.rutina.findMany({
        where: { creadaPorClienteId: null, activa: true },
        include: conEjercicios,
        orderBy: { id: 'asc' },
      }),
      this.prisma.rutina.findMany({
        where: { creadaPorClienteId: clienteId },
        include: conEjercicios,
        orderBy: { id: 'asc' },
      }),
    ])
    const plantillas = plantillasNivel.length ? plantillasNivel : plantillasTodas
    return [...plantillas, ...personales]
  }

  async moverEjercicioDeRutinaPersonal(
    clienteId: string,
    rutinaId: string,
    rutinaEjercicioId: string,
    direccion: 'arriba' | 'abajo',
  ) {
    const actual = await this.obtenerEjercicioDeRutinaPropia(clienteId, rutinaId, rutinaEjercicioId)
    const vecino = await this.prisma.rutinaEjercicio.findFirst({
      where: { rutinaId, orden: direccion === 'arriba' ? { lt: actual.orden } : { gt: actual.orden } },
      orderBy: { orden: direccion === 'arriba' ? 'desc' : 'asc' },
    })
    if (!vecino) return
    await this.prisma.$transaction([
      this.prisma.rutinaEjercicio.update({ where: { id: actual.id }, data: { orden: vecino.orden } }),
      this.prisma.rutinaEjercicio.update({ where: { id: vecino.id }, data: { orden: actual.orden } }),
    ])
  }
}
