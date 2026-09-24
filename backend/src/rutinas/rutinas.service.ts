import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'

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
    const asignacion = await this.prisma.clienteRutina.findFirst({
      where: { clienteId, activa: true },
      orderBy: { fechaInicio: 'desc' },
      include: {
        rutina: {
          include: { ejercicios: { include: { ejercicio: true }, orderBy: { orden: 'asc' } } },
        },
      },
    })
    return asignacion?.rutina ?? null
  }

  async asignarme(clienteId: string, rutinaId: string) {
    const rutina = await this.prisma.rutina.findUnique({ where: { id: rutinaId } })
    if (!rutina) throw new NotFoundException('Rutina no encontrada')

    await this.prisma.clienteRutina.updateMany({
      where: { clienteId, activa: true },
      data: { activa: false },
    })

    return this.prisma.clienteRutina.create({
      data: { clienteId, rutinaId, asignadaPor: 'auto' },
    })
  }

  registrarSesion(
    clienteId: string,
    datos: { rutinaId: string; duracionMin: number; caloriasEstimadas: number },
  ) {
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
}
