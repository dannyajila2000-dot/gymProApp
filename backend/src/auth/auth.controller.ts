import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common'
import { LimiteIntentos, LimiteIntentosGuard } from '../common/limite-intentos.guard.js'
import { AuthService } from './auth.service.js'
import { RegistroDto } from './dto/registro.dto.js'
import { LoginDto } from './dto/login.dto.js'
import { ActivarDto } from './dto/activar.dto.js'
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

  /** Un socio dado de alta en AdminPro activa su cuenta con el código que recibió por correo. */
  @Post('activar')
  @LimiteIntentos({ por: 'email', max: 8, ventanaSeg: 900 }, { por: 'ip', max: 30, ventanaSeg: 900 })
  @HttpCode(200)
  activar(@Body() dto: ActivarDto) {
    return this.authService.activar(dto)
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

  /** "Ya renové": vuelve a consultar la membresía en AdminPro. No lleva el guard de membresía, para poder desbloquearse. */
  @UseGuards(JwtAuthGuard)
  @Post('membresia/actualizar')
  @LimiteIntentos({ por: 'ip', max: 30, ventanaSeg: 600 })
  @HttpCode(200)
  actualizarMembresia(@ClienteActual() cliente: ClienteAutenticado) {
    return this.authService.actualizarMembresia(cliente.clienteId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('cambiar-password')
  @LimiteIntentos({ por: 'ip', max: 10, ventanaSeg: 900 })
  @HttpCode(200)
  cambiarPassword(@ClienteActual() cliente: ClienteAutenticado, @Body() dto: CambiarPasswordDto) {
    return this.authService.cambiarPassword(cliente.clienteId, dto.passwordActual, dto.passwordNueva)
  }
}
