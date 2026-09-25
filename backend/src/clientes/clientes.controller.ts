import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common'
import { ClientesService } from './clientes.service.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { ClienteActual } from '../auth/decorators/cliente-actual.decorator.js'
import type { ClienteAutenticado } from '../auth/decorators/cliente-actual.decorator.js'
import { OnboardingDto } from './dto/onboarding.dto.js'
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js'

@UseGuards(JwtAuthGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post('onboarding')
  completarOnboarding(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: OnboardingDto) {
    return this.clientesService.completarOnboarding(cliente.clienteId, cliente.gimnasioId, dto)
  }

  @Post('recalcular-rutina')
  recalcularRutina(@ClienteActual() cliente: ClienteAutenticado) {
    return this.clientesService.recalcularRutina(cliente.clienteId, cliente.gimnasioId)
  }

  @Patch('perfil')
  actualizarPerfil(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: ActualizarPerfilDto) {
    return this.clientesService.actualizarPerfil(cliente.clienteId, dto)
  }
}
