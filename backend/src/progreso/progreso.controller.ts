import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common'
import { ProgresoService } from './progreso.service.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { ClienteActual } from '../auth/decorators/cliente-actual.decorator.js'
import type { ClienteAutenticado } from '../auth/decorators/cliente-actual.decorator.js'
import { RegistrarProgresoDto } from './dto/registrar-progreso.dto.js'
import { ActualizarAlturaDto } from './dto/actualizar-altura.dto.js'

@UseGuards(JwtAuthGuard)
@Controller('progreso')
export class ProgresoController {
  constructor(private readonly progresoService: ProgresoService) {}

  @Get()
  listar(@ClienteActual() cliente: ClienteAutenticado) {
    return this.progresoService.listar(cliente.clienteId)
  }

  @Post()
  registrar(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: RegistrarProgresoDto) {
    return this.progresoService.registrar(cliente.clienteId, dto)
  }

  @Put('altura')
  actualizarAltura(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: ActualizarAlturaDto) {
    return this.progresoService.actualizarAltura(cliente.clienteId, dto.alturaCm)
  }
}
