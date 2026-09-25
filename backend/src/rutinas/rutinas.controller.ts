import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { RutinasService } from './rutinas.service.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { ClienteActual } from '../auth/decorators/cliente-actual.decorator.js'
import type { ClienteAutenticado } from '../auth/decorators/cliente-actual.decorator.js'
import { AsignarRutinaDto } from './dto/asignar-rutina.dto.js'
import { RegistrarSesionDto } from './dto/registrar-sesion.dto.js'

@UseGuards(JwtAuthGuard)
@Controller('rutinas')
export class RutinasController {
  constructor(private readonly rutinasService: RutinasService) {}

  @Get()
  listarDisponibles(@ClienteActual() cliente: ClienteAutenticado) {
    return this.rutinasService.listarDisponibles(cliente.gimnasioId)
  }

  @Get('mi-rutina')
  miRutina(@ClienteActual() cliente: ClienteAutenticado) {
    return this.rutinasService.miRutina(cliente.clienteId)
  }

  @Post('asignarme')
  asignarme(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: AsignarRutinaDto) {
    return this.rutinasService.asignarme(cliente.clienteId, cliente.gimnasioId, dto.rutinaId)
  }

  @Post('sesiones')
  registrarSesion(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: RegistrarSesionDto) {
    return this.rutinasService.registrarSesion(cliente.clienteId, cliente.gimnasioId, dto)
  }

  @Get('historial')
  historial(@ClienteActual() cliente: ClienteAutenticado) {
    return this.rutinasService.historial(cliente.clienteId)
  }
}
