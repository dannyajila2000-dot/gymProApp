import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { RecordatoriosService } from './recordatorios.service.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { ClienteActual } from '../auth/decorators/cliente-actual.decorator.js'
import type { ClienteAutenticado } from '../auth/decorators/cliente-actual.decorator.js'
import { CrearRecordatorioDto } from './dto/crear-recordatorio.dto.js'
import { ActualizarRecordatorioDto } from './dto/actualizar-recordatorio.dto.js'

@UseGuards(JwtAuthGuard)
@Controller('recordatorios')
export class RecordatoriosController {
  constructor(private readonly recordatoriosService: RecordatoriosService) {}

  @Get()
  listar(@ClienteActual() cliente: ClienteAutenticado) {
    return this.recordatoriosService.listar(cliente.clienteId)
  }

  @Post()
  crear(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: CrearRecordatorioDto) {
    return this.recordatoriosService.crear(cliente.clienteId, dto)
  }

  @Patch(':id')
  actualizar(
    @ClienteActual() cliente: ClienteAutenticado,
    @Param('id') id: string,
    @Body() dto: ActualizarRecordatorioDto,
  ) {
    return this.recordatoriosService.actualizar(cliente.clienteId, id, dto)
  }

  @Delete(':id')
  eliminar(@ClienteActual() cliente: ClienteAutenticado, @Param('id') id: string) {
    return this.recordatoriosService.eliminar(cliente.clienteId, id)
  }
}
