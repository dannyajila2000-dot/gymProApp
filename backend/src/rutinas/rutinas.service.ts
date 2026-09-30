import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  fechaDeHoyEcuador,
  fechaEcuadorDeFecha,
  inicioYFinDeLaSemanaEcuador,
} from '../common/fecha-ecuador.util.js'
import { caloriasEstimadasDeRutina, duracionEstimadaMin } from './estimaciones-rutina.util.js'

type RutinaConEjercicios = Prisma.RutinaGetPayload<{
  include: { ejercicios: { include: { ejercicio: true } } }
}>
type RutinaEjercicioConEjercicio = RutinaConEjercicios['ejercicios'][number]
type PerfilCliente = { nivelFitness: string | null; restriccionFisica: string | null }

// Las rutinas de calentamiento/estiramiento se entrenan solas cuando el cliente
// quiere; nunca se asignan como rutina de un día de forma automática.
const OBJETIVO_CALENTAMIENTO = 'calentamiento'

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
    const asignacion = await this.prisma.clienteRutina.findFirst({
      where: { clienteId, activa: true },
      orderBy: { fechaInicio: 'desc' },
      select: { rutinaId: true },
    })
    if (!asignacion) return null

    return this.rutinaPersonalizada(clienteId, asignacion.rutinaId)
  }

  /**
   * Rutina lista para entrenar (con restricciones, nivel y sustituciones del
   * cliente) sin tocar su rutina activa ni su plan semanal. Solo accesible si
   * es plantilla del gimnasio o rutina propia del cliente.
   */
  async rutinaParaEntrenar(clienteId: string, gimnasioId: string, rutinaId: string) {
    const rutina = await this.prisma.rutina.findFirst({
      where: {
        id: rutinaId,
        gimnasioId,
        activa: true,
        OR: [{ creadaPorClienteId: null }, { creadaPorClienteId: clienteId }],
      },
      select: { id: true },
    })
    if (!rutina) throw new NotFoundException('Rutina no encontrada')

    return this.rutinaPersonalizada(clienteId, rutina.id)
  }

  private async rutinaPersonalizada(clienteId: string, rutinaId: string) {
    const [rutina, cliente, sustituciones] = await Promise.all([
      this.prisma.rutina.findUnique({
        where: { id: rutinaId },
        include: { ejercicios: { include: { ejercicio: true }, orderBy: { orden: 'asc' } } },
      }),
      this.prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { nivelFitness: true, restriccionFisica: true },
      }),
      this.prisma.sustitucionEjercicio.findMany({
        where: { clienteId, rutinaEjercicio: { rutinaId } },
        include: { ejercicioSustituto: true },
      }),
    ])
    if (!rutina) return null

    const mapaSustituciones = new Map(sustituciones.map((s) => [s.rutinaEjercicioId, s.ejercicioSustituto]))
    return this.personalizar(rutina, cliente, mapaSustituciones)
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
      { gimnasioId, activa: true, creadaPorClienteId: null, nivel, objetivo: { not: OBJETIVO_CALENTAMIENTO } },
      { gimnasioId, activa: true, creadaPorClienteId: null, objetivo: { not: OBJETIVO_CALENTAMIENTO } },
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
    // Plantilla del gimnasio o rutina propia: nunca la personal de otro cliente.
    const rutina = await this.prisma.rutina.findFirst({
      where: {
        id: datos.rutinaId,
        gimnasioId,
        OR: [{ creadaPorClienteId: null }, { creadaPorClienteId: clienteId }],
      },
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
   * pertenece a una rutina propia del cliente o a una plantilla activa del
   * gimnasio — nunca a la rutina personal de otro cliente.
   */
  private async obtenerRutinaEjercicioDelCliente(clienteId: string, gimnasioId: string, rutinaEjercicioId: string) {
    const rutinaEjercicio = await this.prisma.rutinaEjercicio.findFirst({
      where: { id: rutinaEjercicioId, rutina: { gimnasioId } },
      include: { ejercicio: true, rutina: true },
    })
    if (!rutinaEjercicio) throw new NotFoundException('Ejercicio no encontrado')
    const { creadaPorClienteId, activa } = rutinaEjercicio.rutina
    const esPropia = creadaPorClienteId === clienteId
    const esPlantillaActiva = creadaPorClienteId === null && activa
    if (!esPropia && !esPlantillaActiva) throw new NotFoundException('Ejercicio no encontrado')

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
      take: 500,
    })
  }

  /**
   * Crea una copia personal (editable) de una rutina, tal como la ve el
   * cliente (con sus ajustes y sustituciones), en una sola transacción: o se
   * copia completa o no se crea nada. No cambia su plan semanal.
   */
  async duplicarComoPersonal(clienteId: string, gimnasioId: string, rutinaId: string) {
    const origen = await this.rutinaParaEntrenar(clienteId, gimnasioId, rutinaId)
    if (!origen) throw new NotFoundException('Rutina no encontrada')

    return this.prisma.rutina.create({
      data: {
        gimnasioId,
        creadaPorClienteId: clienteId,
        nombre: origen.nombre,
        nivel: origen.nivel,
        objetivo: origen.objetivo,
        descripcion: origen.descripcion,
        ejercicios: {
          create: origen.ejercicios.map((item, indice) => ({
            ejercicioId: item.ejercicio.id,
            orden: indice + 1,
            series: item.series,
            repeticiones: item.repeticiones,
            duracionSeg: item.duracionSeg,
            descansoSeg: item.descansoSeg,
          })),
        },
      },
      include: { ejercicios: { include: { ejercicio: true }, orderBy: { orden: 'asc' } } },
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

    const finSemana = new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
    const [sesiones, actividades, poolRotacion, fijadasPorDia] = await Promise.all([
      this.prisma.sesionEntrenamiento.findMany({
        where: { clienteId, completadaEn: { gte: inicio, lte: finSemana } },
        select: {
          completadaEn: true,
          duracionMin: true,
          caloriasEstimadas: true,
          rutina: { select: { id: true, nombre: true } },
        },
        orderBy: { completadaEn: 'asc' },
      }),
      this.prisma.actividadLibre.findMany({
        where: { clienteId, fecha: { gte: inicio, lte: finSemana } },
        select: { fecha: true, duracionMin: true, caloriasEstimadas: true },
      }),
      this.poolDeRotacion(clienteId, cliente?.nivelFitness ?? null),
      this.prisma.rutinaPorDia.findMany({
        where: { clienteId },
        include: { rutina: { include: { ejercicios: { include: { ejercicio: true } } } } },
      }),
    ])
    const rutinaFijadaPorDiaSemana = new Map(fijadasPorDia.map((f) => [f.diaSemana, f.rutina]))
    // Un día cuenta como completado con un entrenamiento o con actividad libre
    // (igual que la racha y el resumen de Progreso). Si hubo varios, se suman.
    const realizadoPorFecha = new Map<string, { duracionMin: number; caloriasEstimadas: number }>()
    const sumarRealizado = (fecha: Date, duracionMin: number, caloriasEstimadas: number) => {
      const clave = fechaEcuadorDeFecha(fecha)
      const previo = realizadoPorFecha.get(clave) ?? { duracionMin: 0, caloriasEstimadas: 0 }
      realizadoPorFecha.set(clave, {
        duracionMin: previo.duracionMin + duracionMin,
        caloriasEstimadas: previo.caloriasEstimadas + caloriasEstimadas,
      })
    }
    // Rutina que realmente se hizo cada día (la última, si hubo varias).
    const rutinaHechaPorFecha = new Map<string, { id: string; nombre: string }>()
    for (const s of sesiones) {
      sumarRealizado(s.completadaEn, s.duracionMin, s.caloriasEstimadas)
      rutinaHechaPorFecha.set(fechaEcuadorDeFecha(s.completadaEn), s.rutina)
    }
    for (const a of actividades) sumarRealizado(a.fecha, a.duracionMin, a.caloriasEstimadas)
    const numeroSemana = Math.floor(inicio.getTime() / (7 * 24 * 60 * 60 * 1000))
    const dias = []
    for (let diaSemana = 0; diaSemana < 7; diaSemana++) {
      const fecha = fechaEcuadorDeFecha(new Date(inicio.getTime() + diaSemana * 24 * 60 * 60 * 1000))
      const esDiaEntrenamiento = diasSemanaEntrenamiento.includes(diaSemana)
      const posicionEnSemana = diasSemanaEntrenamiento.indexOf(diaSemana)
      const rutinaFijada = rutinaFijadaPorDiaSemana.get(diaSemana) ?? null
      const sugerenciaRotacion =
        esDiaEntrenamiento && poolRotacion.length > 0
          ? poolRotacion[(numeroSemana * diasSemanaEntrenamiento.length + posicionEnSemana) % poolRotacion.length]
          : null
      // Lo que el cliente fijó para este día manda; si no fijó nada, la app
      // sugiere una rutina rotando según su nivel y objetivo.
      const rutinaDelDia = rutinaFijada ?? sugerenciaRotacion
      const realizado = realizadoPorFecha.get(fecha)
      const rutinaHecha = rutinaHechaPorFecha.get(fecha)
      const completado = realizado != null
      // Si ya se completó, se muestra lo que de verdad duró/quemó ese día;
      // si no, se muestra la estimación calculada a partir de los ejercicios
      // configurados en la rutina (misma fórmula que en el detalle de rutina).
      const duracionMin = realizado?.duracionMin ?? (rutinaDelDia ? duracionEstimadaMin(rutinaDelDia) : null)
      const caloriasEstimadas =
        realizado?.caloriasEstimadas ?? (rutinaDelDia ? caloriasEstimadasDeRutina(rutinaDelDia) : null)
      const numeroDia =
        Math.floor((Date.parse(`${fecha}T00:00:00Z`) - Date.parse(`${fechaInicioCliente}T00:00:00Z`)) / 86400000) + 1

      dias.push({
        fecha,
        diaSemana,
        numeroDia: Math.max(1, numeroDia),
        // Un día de descanso con rutina fijada a mano también cuenta como entrenamiento.
        esDiaEntrenamiento: esDiaEntrenamiento || rutinaFijada != null,
        completado,
        progresoPct: completado ? 100 : 0,
        esHoy: fecha === hoy,
        // Un día ya entrenado muestra la rutina que se hizo, no la que saldría hoy con el catálogo actual.
        rutinaId: rutinaHecha?.id ?? rutinaDelDia?.id ?? null,
        rutinaNombre: rutinaHecha?.nombre ?? rutinaDelDia?.nombre ?? null,
        fijadaPorCliente: rutinaFijada != null,
        duracionMin,
        caloriasEstimadas: caloriasEstimadas != null ? Math.round(caloriasEstimadas) : null,
      })
    }
    return dias
  }

  /**
   * Conjunto de rutinas entre las que rota el plan automático: plantillas del
   * gimnasio que combinan con el nivel y el objetivo calculado en el
   * onboarding. Si no hay combinación exacta se relaja primero el objetivo y
   * luego el nivel. Las rutinas personales no entran: el cliente las coloca a
   * mano en los días que quiera. Se ordena de forma estable para que la
   * rotación sea determinística entre llamadas.
   */
  private async poolDeRotacion(clienteId: string, nivelFitness: string | null) {
    const [plantillas, asignacionOnboarding] = await Promise.all([
      this.prisma.rutina.findMany({
        where: {
          creadaPorClienteId: null,
          activa: true,
          objetivo: { not: OBJETIVO_CALENTAMIENTO },
          ejercicios: { some: {} },
        },
        include: { ejercicios: { include: { ejercicio: true } } },
        orderBy: { id: 'asc' },
      }),
      this.prisma.clienteRutina.findFirst({
        where: { clienteId, asignadaPor: 'auto-onboarding' },
        orderBy: { fechaInicio: 'desc' },
        select: { rutina: { select: { objetivo: true } } },
      }),
    ])
    const objetivo = asignacionOnboarding?.rutina.objetivo ?? null

    const delNivel = nivelFitness ? plantillas.filter((r) => r.nivel === nivelFitness) : []
    const nivelYObjetivo = objetivo ? delNivel.filter((r) => r.objetivo === objetivo) : []
    if (nivelYObjetivo.length) return nivelYObjetivo
    if (delNivel.length) return delNivel
    const soloObjetivo = objetivo ? plantillas.filter((r) => r.objetivo === objetivo) : []
    return soloObjetivo.length ? soloObjetivo : plantillas
  }

  /**
   * Reordena de una sola vez (arrastrar-y-soltar en el móvil, en vez de
   * mover de a uno con flechas). `ordenIds` debe contener exactamente los
   * mismos rutinaEjercicioId que ya tiene la rutina, en el orden nuevo.
   */
  async reordenarEjerciciosPersonal(clienteId: string, rutinaId: string, ordenIds: string[]) {
    await this.obtenerRutinaPropia(clienteId, rutinaId)
    const actuales = await this.prisma.rutinaEjercicio.findMany({ where: { rutinaId }, select: { id: true } })
    const idsActuales = new Set(actuales.map((e) => e.id))
    const idsNuevos = new Set(ordenIds)
    if (idsActuales.size !== ordenIds.length || [...idsActuales].some((id) => !idsNuevos.has(id))) {
      throw new BadRequestException('El nuevo orden no coincide con los ejercicios de esta rutina')
    }

    await this.prisma.$transaction(
      ordenIds.map((id, indice) => this.prisma.rutinaEjercicio.update({ where: { id }, data: { orden: indice + 1 } })),
    )
  }

  /**
   * Fija una rutina concreta a un día de la semana (0=domingo..6=sábado) para
   * que planSemana() deje de rotar automáticamente ese día — es opcional,
   * a mano, y se puede quitar en cualquier momento con quitarRutinaDeDia().
   */
  async fijarRutinaEnDia(clienteId: string, gimnasioId: string, diaSemana: number, rutinaId: string) {
    if (!Number.isInteger(diaSemana) || diaSemana < 0 || diaSemana > 6) {
      throw new BadRequestException('Día de la semana inválido')
    }
    const rutina = await this.prisma.rutina.findFirst({
      where: { id: rutinaId, OR: [{ gimnasioId, creadaPorClienteId: null }, { creadaPorClienteId: clienteId }] },
    })
    if (!rutina) throw new NotFoundException('Rutina no encontrada')

    return this.prisma.rutinaPorDia.upsert({
      where: { clienteId_diaSemana: { clienteId, diaSemana } },
      create: { clienteId, diaSemana, rutinaId },
      update: { rutinaId },
    })
  }

  async quitarRutinaDeDia(clienteId: string, diaSemana: number) {
    await this.prisma.rutinaPorDia.deleteMany({ where: { clienteId, diaSemana } })
  }

  listarRutinasFijadas(clienteId: string) {
    return this.prisma.rutinaPorDia.findMany({ where: { clienteId }, include: { rutina: true } })
  }
}
