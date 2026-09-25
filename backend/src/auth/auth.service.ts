import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service.js'
import { RegistroDto } from './dto/registro.dto.js'
import { LoginDto } from './dto/login.dto.js'

interface PayloadAcceso {
  sub: string
  gimnasioId: string
  email: string
}

const RONDAS_BCRYPT = 12

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private async buscarGimnasioActivo(codigo: string) {
    const gimnasio = await this.prisma.gimnasio.findUnique({ where: { codigo } })
    if (!gimnasio || !gimnasio.activo) {
      throw new NotFoundException('No encontramos un gimnasio con ese código')
    }
    return gimnasio
  }

  private async emitirTokens(cliente: { id: string; gimnasioId: string; email: string }) {
    const payload: PayloadAcceso = {
      sub: cliente.id,
      gimnasioId: cliente.gimnasioId,
      email: cliente.email,
    }
    const accessTtlSegundos = Number(process.env.JWT_ACCESS_TTL_SEGUNDOS ?? 900)
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: accessTtlSegundos,
    })

    const jti = randomUUID()
    const diasTtl = Number(process.env.JWT_REFRESH_TTL_DIAS ?? 30)
    const refreshTtlSegundos = diasTtl * 24 * 60 * 60
    const expiraEn = new Date(Date.now() + refreshTtlSegundos * 1000)

    const refreshToken = await this.jwt.signAsync(
      { sub: cliente.id, jti },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: refreshTtlSegundos },
    )

    await this.prisma.refreshToken.create({
      data: { clienteId: cliente.id, jti, expiraEn },
    })

    return { accessToken, refreshToken }
  }

  async registro(dto: RegistroDto) {
    const gimnasio = await this.buscarGimnasioActivo(dto.codigoGimnasio)

    const yaExiste = await this.prisma.cliente.findUnique({
      where: { gimnasioId_email: { gimnasioId: gimnasio.id, email: dto.email } },
    })
    if (yaExiste) {
      throw new ConflictException('Ya existe una cuenta con ese correo en este gimnasio')
    }

    const passwordHash = await bcrypt.hash(dto.password, RONDAS_BCRYPT)
    const cliente = await this.prisma.cliente.create({
      data: {
        gimnasioId: gimnasio.id,
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        email: dto.email,
        passwordHash,
      },
    })

    const tokens = await this.emitirTokens(cliente)
    return { cliente: this.aPerfilPublico(cliente, gimnasio.nombre), ...tokens }
  }

  async login(dto: LoginDto) {
    const gimnasio = await this.buscarGimnasioActivo(dto.codigoGimnasio)

    const cliente = await this.prisma.cliente.findUnique({
      where: { gimnasioId_email: { gimnasioId: gimnasio.id, email: dto.email } },
    })
    if (!cliente || !cliente.activo) {
      throw new UnauthorizedException('Correo o contraseña incorrectos')
    }

    const claveValida = await bcrypt.compare(dto.password, cliente.passwordHash)
    if (!claveValida) {
      throw new UnauthorizedException('Correo o contraseña incorrectos')
    }

    const tokens = await this.emitirTokens(cliente)
    return { cliente: this.aPerfilPublico(cliente, gimnasio.nombre), ...tokens }
  }

  async refrescar(refreshToken: string) {
    let payload: { sub: string; jti: string }
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      })
    } catch {
      throw new UnauthorizedException('Sesión inválida, vuelve a iniciar sesión')
    }

    const registro = await this.prisma.refreshToken.findUnique({ where: { jti: payload.jti } })
    if (!registro || registro.revocado || registro.expiraEn < new Date() || registro.clienteId !== payload.sub) {
      throw new UnauthorizedException('Sesión inválida, vuelve a iniciar sesión')
    }

    const cliente = await this.prisma.cliente.findUnique({ where: { id: payload.sub } })
    if (!cliente || !cliente.activo) {
      throw new UnauthorizedException('Sesión inválida, vuelve a iniciar sesión')
    }

    await this.prisma.refreshToken.update({
      where: { id: registro.id },
      data: { revocado: true },
    })

    return this.emitirTokens(cliente)
  }

  async cerrarSesion(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ jti: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      })
      await this.prisma.refreshToken.updateMany({
        where: { jti: payload.jti },
        data: { revocado: true },
      })
    } catch {
      // token ya inválido o expirado: no hay nada que revocar
    }
    return { ok: true }
  }

  async perfil(clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      include: { gimnasio: true },
    })
    if (!cliente) throw new BadRequestException('Cliente no encontrado')
    return this.aPerfilPublico(cliente, cliente.gimnasio.nombre)
  }

  async cambiarPassword(clienteId: string, passwordActual: string, passwordNueva: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId } })
    if (!cliente) throw new BadRequestException('Cliente no encontrado')

    const claveValida = await bcrypt.compare(passwordActual, cliente.passwordHash)
    if (!claveValida) throw new UnauthorizedException('Tu contraseña actual no es correcta')

    const passwordHash = await bcrypt.hash(passwordNueva, RONDAS_BCRYPT)
    await this.prisma.cliente.update({ where: { id: clienteId }, data: { passwordHash } })
    return { ok: true }
  }

  private aPerfilPublico(
    cliente: {
      id: string
      nombres: string
      apellidos: string
      email: string
      gimnasioId: string
      telefono?: string | null
      alturaCm?: number | null
      fechaNacimiento?: Date | null
      unidadPeso?: string
      unidadAltura?: string
      restriccionFisica?: string | null
      preferenciaEntrenador?: string
      onboardingCompletado?: boolean
    },
    nombreGimnasio: string,
  ) {
    return {
      id: cliente.id,
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      email: cliente.email,
      gimnasioId: cliente.gimnasioId,
      gimnasio: nombreGimnasio,
      telefono: cliente.telefono ?? null,
      alturaCm: cliente.alturaCm ?? null,
      fechaNacimiento: cliente.fechaNacimiento ? cliente.fechaNacimiento.toISOString().slice(0, 10) : null,
      unidadPeso: cliente.unidadPeso ?? 'kg',
      unidadAltura: cliente.unidadAltura ?? 'cm',
      restriccionFisica: cliente.restriccionFisica ?? null,
      preferenciaEntrenador: cliente.preferenciaEntrenador ?? 'animacion',
      onboardingCompletado: cliente.onboardingCompletado ?? false,
    }
  }
}
