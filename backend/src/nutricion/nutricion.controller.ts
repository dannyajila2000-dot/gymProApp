import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { NutricionService } from './nutricion.service.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { ClienteActual } from '../auth/decorators/cliente-actual.decorator.js'
import type { ClienteAutenticado } from '../auth/decorators/cliente-actual.decorator.js'
import { ActualizarMetaDto } from './dto/actualizar-meta.dto.js'
import { AgregarComidaDto } from './dto/agregar-comida.dto.js'
import { AgregarAguaDto } from './dto/agregar-agua.dto.js'

function fechaDeHoy() {
  return new Date().toISOString().slice(0, 10)
}

@UseGuards(JwtAuthGuard)
@Controller('nutricion')
export class NutricionController {
  constructor(private readonly nutricionService: NutricionService) {}

  @Get('meta')
  obtenerMeta(@ClienteActual() cliente: ClienteAutenticado) {
    return this.nutricionService.obtenerMeta(cliente.clienteId)
  }

  @Put('meta')
  actualizarMeta(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: ActualizarMetaDto) {
    return this.nutricionService.actualizarMeta(cliente.clienteId, dto)
  }

  @Get('comidas')
  listarComidas(@ClienteActual() cliente: ClienteAutenticado, @Query('fecha') fecha?: string) {
    return this.nutricionService.listarComidas(cliente.clienteId, fecha ?? fechaDeHoy())
  }

  @Post('comidas')
  agregarComida(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: AgregarComidaDto) {
    return this.nutricionService.agregarComida(cliente.clienteId, dto)
  }

  @Delete('comidas/:id')
  eliminarComida(@ClienteActual() cliente: ClienteAutenticado, @Param('id') id: string) {
    return this.nutricionService.eliminarComida(cliente.clienteId, id)
  }

  @Get('agua')
  agua(@ClienteActual() cliente: ClienteAutenticado, @Query('fecha') fecha?: string) {
    return this.nutricionService.agua(cliente.clienteId, fecha ?? fechaDeHoy())
  }

  @Post('agua')
  agregarAgua(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: AgregarAguaDto) {
    return this.nutricionService.agregarAgua(cliente.clienteId, dto.cantidadMl)
  }
}
