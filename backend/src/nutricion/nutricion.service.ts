import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'

function inicioYFinDelDia(fecha: string) {
  const inicio = new Date(`${fecha}T00:00:00.000Z`)
  const fin = new Date(`${fecha}T23:59:59.999Z`)
  return { inicio, fin }
}

@Injectable()
export class NutricionService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerMeta(clienteId: string) {
    const meta = await this.prisma.metaNutricional.findUnique({ where: { clienteId } })
    if (meta) return meta

    return this.prisma.metaNutricional.create({
      data: { clienteId, caloriasObjetivo: 2000, aguaObjetivoMl: 2000 },
    })
  }

  actualizarMeta(
    clienteId: string,
    datos: {
      caloriasObjetivo?: number
      proteinaObjetivoG?: number
      carbosObjetivoG?: number
      grasaObjetivoG?: number
      aguaObjetivoMl?: number
    },
  ) {
    return this.prisma.metaNutricional.upsert({
      where: { clienteId },
      create: { clienteId, caloriasObjetivo: 2000, aguaObjetivoMl: 2000, ...datos },
      update: datos,
    })
  }

  listarComidas(clienteId: string, fecha: string) {
    const { inicio, fin } = inicioYFinDelDia(fecha)
    return this.prisma.comida.findMany({
      where: { clienteId, fecha: { gte: inicio, lte: fin } },
      orderBy: { fecha: 'asc' },
    })
  }

  agregarComida(
    clienteId: string,
    datos: {
      tipo: string
      nombre: string
      calorias: number
      proteinaG?: number
      carbosG?: number
      grasaG?: number
    },
  ) {
    return this.prisma.comida.create({ data: { clienteId, ...datos } })
  }

  eliminarComida(clienteId: string, id: string) {
    return this.prisma.comida.deleteMany({ where: { id, clienteId } })
  }

  async agua(clienteId: string, fecha: string) {
    const { inicio, fin } = inicioYFinDelDia(fecha)
    const registros = await this.prisma.registroAgua.findMany({
      where: { clienteId, fecha: { gte: inicio, lte: fin } },
      orderBy: { fecha: 'asc' },
    })
    const totalMl = registros.reduce((suma, registro) => suma + registro.cantidadMl, 0)
    return { registros, totalMl }
  }

  agregarAgua(clienteId: string, cantidadMl: number) {
    return this.prisma.registroAgua.create({ data: { clienteId, cantidadMl } })
  }
}
