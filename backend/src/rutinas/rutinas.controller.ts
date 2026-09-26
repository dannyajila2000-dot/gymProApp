import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { RutinasService } from './rutinas.service.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { ClienteActual } from '../auth/decorators/cliente-actual.decorator.js'
import type { ClienteAutenticado } from '../auth/decorators/cliente-actual.decorator.js'
import { AsignarRutinaDto } from './dto/asignar-rutina.dto.js'
import { RegistrarSesionDto } from './dto/registrar-sesion.dto.js'
import { SustituirEjercicioDto } from './dto/sustituir-ejercicio.dto.js'

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

  @Get('ejercicios/:rutinaEjercicioId/alternativas')
  alternativas(
    @ClienteActual() cliente: ClienteAutenticado,
    @Param('rutinaEjercicioId') rutinaEjercicioId: string,
  ) {
    return this.rutinasService.alternativasParaEjercicio(cliente.clienteId, cliente.gimnasioId, rutinaEjercicioId)
  }

  @Post('ejercicios/:rutinaEjercicioId/sustituir')
  sustituir(
    @ClienteActual() cliente: ClienteAutenticado,
    @Param('rutinaEjercicioId') rutinaEjercicioId: string,
    @Body() dto: SustituirEjercicioDto,
  ) {
    return this.rutinasService.sustituirEjercicio(
      cliente.clienteId,
      cliente.gimnasioId,
      rutinaEjercicioId,
      dto.ejercicioId,
    )
  }

  @Delete('ejercicios/:rutinaEjercicioId/sustituir')
  quitarSustitucion(
    @ClienteActual() cliente: ClienteAutenticado,
    @Param('rutinaEjercicioId') rutinaEjercicioId: string,
  ) {
    return this.rutinasService.quitarSustitucion(cliente.clienteId, rutinaEjercicioId)
  }
}
