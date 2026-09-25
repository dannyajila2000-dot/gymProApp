import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { inicioYFinDelDiaEcuador, inicioYFinDeLaSemanaEcuador } from '../common/fecha-ecuador.util.js'

@Injectable()
export class ProgresoService {
  constructor(private readonly prisma: PrismaService) {}

  listar(clienteId: string) {
    return this.prisma.registroProgreso.findMany({
      where: { clienteId },
      orderBy: { fecha: 'desc' },
    })
  }

  registrar(
    clienteId: string,
    datos: { pesoKg?: number; grasaCorporalPct?: number; medidas?: Record<string, number>; fotoUrl?: string },
  ) {
    return this.prisma.registroProgreso.create({
      data: {
        clienteId,
        pesoKg: datos.pesoKg,
        grasaCorporalPct: datos.grasaCorporalPct,
        medidas: datos.medidas,
        fotoUrl: datos.fotoUrl,
      },
    })
  }

  async actualizarAltura(clienteId: string, alturaCm: number) {
    const cliente = await this.prisma.cliente.update({
      where: { id: clienteId },
      data: { alturaCm },
    })
    return { alturaCm: cliente.alturaCm }
  }

  async actualizarPesoObjetivo(clienteId: string, pesoObjetivoKg: number) {
    const cliente = await this.prisma.cliente.update({
      where: { id: clienteId },
      data: { pesoObjetivoKg },
    })
    return { pesoObjetivoKg: cliente.pesoObjetivoKg }
  }

  async obtenerMetaSeguimiento(clienteId: string) {
    const meta = await this.prisma.metaSeguimiento.findUnique({ where: { clienteId } })
    if (meta) return meta
    return this.prisma.metaSeguimiento.create({ data: { clienteId } })
  }

  actualizarMetaSeguimiento(
    clienteId: string,
    datos: { caloriasQuemarObjetivo?: number; duracionObjetivoMin?: number; pasosObjetivo?: number; pasosActivo?: boolean },
  ) {
    return this.prisma.metaSeguimiento.upsert({
      where: { clienteId },
      create: { clienteId, ...datos },
      update: datos,
    })
  }

  async pasosDelDia(clienteId: string, fecha: string) {
    const { inicio, fin } = inicioYFinDelDiaEcuador(fecha)
    const registros = await this.prisma.registroPasos.findMany({
      where: { clienteId, fecha: { gte: inicio, lte: fin } },
    })
    const total = registros.reduce((suma, r) => suma + r.cantidad, 0)
    return { total }
  }

  registrarPasos(clienteId: string, cantidad: number) {
    return this.prisma.registroPasos.create({ data: { clienteId, cantidad } })
  }

  async pasosPorSemana(clienteId: string, fecha: string) {
    const { inicio, fin } = inicioYFinDeLaSemanaEcuador(fecha)
    const registros = await this.prisma.registroPasos.findMany({
      where: { clienteId, fecha: { gte: inicio, lte: fin } },
      orderBy: { fecha: 'asc' },
    })
    return this.agruparPorDia(registros, inicio, (r) => r.cantidad)
  }

  listarActividades(clienteId: string) {
    return this.prisma.actividadLibre.findMany({
      where: { clienteId },
      orderBy: { fecha: 'desc' },
      take: 30,
    })
  }

  registrarActividad(
    clienteId: string,
    datos: { nombre: string; duracionMin: number; distanciaM?: number; caloriasEstimadas: number },
  ) {
    return this.prisma.actividadLibre.create({ data: { clienteId, ...datos } })
  }

  eliminarActividad(clienteId: string, id: string) {
    return this.prisma.actividadLibre.deleteMany({ where: { id, clienteId } })
  }

  async resumenDeHoy(clienteId: string, fecha: string) {
    const { inicio, fin } = inicioYFinDelDiaEcuador(fecha)
    const [sesiones, actividades, agua, meta] = await Promise.all([
      this.prisma.sesionEntrenamiento.findMany({ where: { clienteId, completadaEn: { gte: inicio, lte: fin } } }),
      this.prisma.actividadLibre.findMany({ where: { clienteId, fecha: { gte: inicio, lte: fin } } }),
      this.pasosDelDia(clienteId, fecha),
      this.obtenerMetaSeguimiento(clienteId),
    ])

    const caloriasQuemadas =
      sesiones.reduce((s, x) => s + x.caloriasEstimadas, 0) + actividades.reduce((s, x) => s + x.caloriasEstimadas, 0)
    const duracionMin =
      sesiones.reduce((s, x) => s + x.duracionMin, 0) + actividades.reduce((s, x) => s + x.duracionMin, 0)

    return {
      caloriasQuemadas: Math.round(caloriasQuemadas),
      duracionMin,
      pasos: agua.total,
      meta,
    }
  }

  async resumenDeLaSemana(clienteId: string, fecha: string) {
    const { inicio, fin } = inicioYFinDeLaSemanaEcuador(fecha)
    const [sesiones, actividades] = await Promise.all([
      this.prisma.sesionEntrenamiento.findMany({ where: { clienteId, completadaEn: { gte: inicio, lte: fin } } }),
      this.prisma.actividadLibre.findMany({ where: { clienteId, fecha: { gte: inicio, lte: fin } } }),
    ])

    const diasCompletados = new Set<number>()
    for (const s of sesiones) diasCompletados.add(this.diaDeLaSemana(s.completadaEn, inicio))
    for (const a of actividades) diasCompletados.add(this.diaDeLaSemana(a.fecha, inicio))

    const caloriasTotales =
      sesiones.reduce((s, x) => s + x.caloriasEstimadas, 0) + actividades.reduce((s, x) => s + x.caloriasEstimadas, 0)
    const minutosTotales =
      sesiones.reduce((s, x) => s + x.duracionMin, 0) + actividades.reduce((s, x) => s + x.duracionMin, 0)

    const racha = await this.calcularRacha(clienteId)

    return {
      entrenamientos: sesiones.length + actividades.length,
      caloriasTotales: Math.round(caloriasTotales),
      minutosTotales,
      diasCompletados: [...diasCompletados].sort((a, b) => a - b),
      racha,
    }
  }

  private async calcularRacha(clienteId: string) {
    const sesiones = await this.prisma.sesionEntrenamiento.findMany({
      where: { clienteId },
      select: { completadaEn: true },
      orderBy: { completadaEn: 'desc' },
      take: 60,
    })
    const actividades = await this.prisma.actividadLibre.findMany({
      where: { clienteId },
      select: { fecha: true },
      orderBy: { fecha: 'desc' },
      take: 60,
    })
    const diasConActividad = new Set(
      [...sesiones.map((s) => s.completadaEn), ...actividades.map((a) => a.fecha)].map((f) =>
        f.toISOString().slice(0, 10),
      ),
    )

    let racha = 0
    const cursor = new Date()
    for (;;) {
      const clave = cursor.toISOString().slice(0, 10)
      if (!diasConActividad.has(clave)) break
      racha++
      cursor.setUTCDate(cursor.getUTCDate() - 1)
    }
    return racha
  }

  private diaDeLaSemana(fecha: Date, inicioSemana: Date) {
    return Math.floor((fecha.getTime() - inicioSemana.getTime()) / (24 * 60 * 60 * 1000))
  }

  private agruparPorDia<T>(registros: T[], inicioSemana: Date, valor: (item: T) => number) {
    const totalesPorDia = [0, 0, 0, 0, 0, 0, 0]
    for (const registro of registros as unknown as { fecha: Date }[]) {
      const dia = this.diaDeLaSemana(registro.fecha, inicioSemana)
      if (dia >= 0 && dia < 7) totalesPorDia[dia] += valor(registro as unknown as T)
    }
    return totalesPorDia
  }
}
