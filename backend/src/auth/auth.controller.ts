import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common'
import { LimiteIntentos, LimiteIntentosGuard } from '../common/limite-intentos.guard.js'
import { AuthService } from './auth.service.js'
import { RegistroDto } from './dto/registro.dto.js'
import { LoginDto } from './dto/login.dto.js'
import { RefreshDto } from './dto/refresh.dto.js'
import { CambiarPasswordDto } from './dto/cambiar-password.dto.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'
import { ClienteActual } from './decorators/cliente-actual.decorator.js'
import type { ClienteAutenticado } from './decorators/cliente-actual.decorator.js'

@Controller('auth')
@UseGuards(LimiteIntentosGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  @LimiteIntentos({ por: 'ip', max: 10, ventanaSeg: 3600 })
  registro(@Body() dto: RegistroDto) {
    return this.authService.registro(dto)
  }

  // 10 intentos por cuenta cada 10 minutos (frena adivinar una contraseña) y 60 por origen como respaldo.
  @Post('login')
  @LimiteIntentos({ por: 'email', max: 10, ventanaSeg: 600 }, { por: 'ip', max: 60, ventanaSeg: 600 })
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('refrescar')
  @LimiteIntentos({ por: 'ip', max: 120, ventanaSeg: 600 })
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

  @UseGuards(JwtAuthGuard)
  @Post('cambiar-password')
  @LimiteIntentos({ por: 'ip', max: 10, ventanaSeg: 900 })
  @HttpCode(200)
  cambiarPassword(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: CambiarPasswordDto) {
    return this.authService.cambiarPassword(cliente.clienteId, dto.passwordActual, dto.passwordNueva)
  }
}
