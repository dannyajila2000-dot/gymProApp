import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CrearFeedbackDto } from './dto/crear-feedback.dto.js'

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  crear(clienteId: string, dto: CrearFeedbackDto) {
    return this.prisma.feedback.create({
      data: { clienteId, categoria: dto.categoria, mensaje: dto.mensaje },
    })
  }
}
