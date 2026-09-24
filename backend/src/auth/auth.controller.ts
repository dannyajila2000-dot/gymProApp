import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { RegistroDto } from './dto/registro.dto.js'
import { LoginDto } from './dto/login.dto.js'
import { RefreshDto } from './dto/refresh.dto.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'
import { ClienteActual } from './decorators/cliente-actual.decorator.js'
import type { ClienteAutenticado } from './decorators/cliente-actual.decorator.js'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  registro(@Body() dto: RegistroDto) {
    return this.authService.registro(dto)
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('refrescar')
  @HttpCode(200)
  refrescar(@Body() dto: RefreshDto) {
    return this.authService.refrescar(dto.refreshToken)
  }

  @Post('cerrar-sesion')
  @HttpCode(200)
  cerrarSesion(@Body() dto: RefreshDto) {
    return this.authService.cerrarSesion(dto.refreshToken)
  }

  @UseGuards(JwtAuthGuard)
  @Get('yo')
  yo(@ClienteActual() cliente: ClienteAutenticado) {
    return this.authService.perfil(cliente.clienteId)
  }
}
