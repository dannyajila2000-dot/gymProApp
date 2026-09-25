import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CrearRecordatorioDto } from './dto/crear-recordatorio.dto.js'
import { ActualizarRecordatorioDto } from './dto/actualizar-recordatorio.dto.js'

@Injectable()
export class RecordatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  listar(clienteId: string) {
    return this.prisma.recordatorio.findMany({
      where: { clienteId },
      orderBy: { hora: 'asc' },
    })
  }

  crear(clienteId: string, dto: CrearRecordatorioDto) {
    return this.prisma.recordatorio.create({
      data: { clienteId, hora: dto.hora, diasSemana: dto.diasSemana },
    })
  }

  async actualizar(clienteId: string, id: string, dto: ActualizarRecordatorioDto) {
    const existente = await this.prisma.recordatorio.findFirst({ where: { id, clienteId } })
    if (!existente) throw new NotFoundException('Recordatorio no encontrado')

    return this.prisma.recordatorio.update({
      where: { id },
      data: { hora: dto.hora, diasSemana: dto.diasSemana, activo: dto.activo },
    })
  }

  async eliminar(clienteId: string, id: string) {
    const resultado = await this.prisma.recordatorio.deleteMany({ where: { id, clienteId } })
    if (resultado.count === 0) throw new NotFoundException('Recordatorio no encontrado')
    return { ok: true }
  }
}
