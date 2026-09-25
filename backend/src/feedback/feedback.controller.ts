import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { FeedbackService } from './feedback.service.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { ClienteActual } from '../auth/decorators/cliente-actual.decorator.js'
import type { ClienteAutenticado } from '../auth/decorators/cliente-actual.decorator.js'
import { CrearFeedbackDto } from './dto/crear-feedback.dto.js'

@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  crear(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: CrearFeedbackDto) {
    return this.feedbackService.crear(cliente.clienteId, dto)
  }
}
