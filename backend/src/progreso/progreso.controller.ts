import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ProgresoService } from './progreso.service.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { ClienteActual } from '../auth/decorators/cliente-actual.decorator.js'
import type { ClienteAutenticado } from '../auth/decorators/cliente-actual.decorator.js'
import { RegistrarProgresoDto } from './dto/registrar-progreso.dto.js'
import { ActualizarAlturaDto } from './dto/actualizar-altura.dto.js'
import { ActualizarPesoObjetivoDto } from './dto/actualizar-peso-objetivo.dto.js'
import { ActualizarMetaSeguimientoDto } from './dto/actualizar-meta-seguimiento.dto.js'
import { RegistrarPasosDto } from './dto/registrar-pasos.dto.js'
import { RegistrarActividadDto } from './dto/registrar-actividad.dto.js'
import { ConsultarFechaDto } from '../nutricion/dto/consultar-fecha.dto.js'
import { fechaDeHoyEcuador } from '../common/fecha-ecuador.util.js'

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

  @Put('peso-objetivo')
  actualizarPesoObjetivo(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: ActualizarPesoObjetivoDto) {
    return this.progresoService.actualizarPesoObjetivo(cliente.clienteId, dto.pesoObjetivoKg)
  }

  @Get('meta-seguimiento')
  obtenerMetaSeguimiento(@ClienteActual() cliente: ClienteAutenticado) {
    return this.progresoService.obtenerMetaSeguimiento(cliente.clienteId)
  }

  @Put('meta-seguimiento')
  actualizarMetaSeguimiento(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: ActualizarMetaSeguimientoDto) {
    return this.progresoService.actualizarMetaSeguimiento(cliente.clienteId, dto)
  }

  @Get('pasos')
  pasosDelDia(@ClienteActual() cliente: ClienteAutenticado, @Query() { fecha }: ConsultarFechaDto) {
    return this.progresoService.pasosDelDia(cliente.clienteId, fecha ?? fechaDeHoyEcuador())
  }

  @Post('pasos')
  registrarPasos(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: RegistrarPasosDto) {
    return this.progresoService.registrarPasos(cliente.clienteId, dto.cantidad)
  }

  @Get('pasos/semana')
  pasosPorSemana(@ClienteActual() cliente: ClienteAutenticado, @Query() { fecha }: ConsultarFechaDto) {
    return this.progresoService.pasosPorSemana(cliente.clienteId, fecha ?? fechaDeHoyEcuador())
  }

  @Get('actividades')
  listarActividades(@ClienteActual() cliente: ClienteAutenticado) {
    return this.progresoService.listarActividades(cliente.clienteId)
  }

  @Post('actividades')
  registrarActividad(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: RegistrarActividadDto) {
    return this.progresoService.registrarActividad(cliente.clienteId, dto)
  }

  @Delete('actividades/:id')
  eliminarActividad(@ClienteActual() cliente: ClienteAutenticado, @Param('id') id: string) {
    return this.progresoService.eliminarActividad(cliente.clienteId, id)
  }

  @Get('resumen/hoy')
  resumenDeHoy(@ClienteActual() cliente: ClienteAutenticado, @Query() { fecha }: ConsultarFechaDto) {
    return this.progresoService.resumenDeHoy(cliente.clienteId, fecha ?? fechaDeHoyEcuador())
  }

  @Get('resumen/semana')
  resumenDeLaSemana(@ClienteActual() cliente: ClienteAutenticado, @Query() { fecha }: ConsultarFechaDto) {
    return this.progresoService.resumenDeLaSemana(cliente.clienteId, fecha ?? fechaDeHoyEcuador())
  }
}
