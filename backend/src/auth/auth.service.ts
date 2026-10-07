import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service.js'
import { RegistroDto } from './dto/registro.dto.js'
import { LoginDto } from './dto/login.dto.js'
import { ActivarDto } from './dto/activar.dto.js'
import { AdminProClient, AdminProNoDisponible, AdminProRechazo } from '../integracion/adminpro.client.js'
import { MembresiaService } from '../integracion/membresia.service.js'
import { resumenMembresia } from '../integracion/membresia.util.js'

interface PayloadAcceso {
  sub: string
  gimnasioId: string
  email: string
}

const RONDAS_BCRYPT = 12

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly adminpro: AdminProClient,
    private readonly membresias: MembresiaService,
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
    // Interruptor para cerrar las altas de cuentas (p. ej. mientras se reparte una versión de prueba):
    // REGISTRO_HABILITADO=false en las variables de entorno. Si no existe, el registro sigue abierto.
    if (process.env.REGISTRO_HABILITADO === 'false') {
      throw new ForbiddenException('El registro de cuentas nuevas está deshabilitado por ahora')
    }

    const gimnasio = await this.buscarGimnasioActivo(dto.codigoGimnasio)
    if (gimnasio.adminIntegrado) {
      throw new ForbiddenException(
        'Tu gimnasio da de alta a sus socios. Pídeles que te inviten a la app y usa "Activar mi cuenta".',
      )
    }

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
    return { cliente: this.aPerfilPublico(cliente, gimnasio, await this.pesoActualKg(cliente.id)), ...tokens }
  }

  async login(dto: LoginDto) {
    const gimnasio = await this.buscarGimnasioActivo(dto.codigoGimnasio)

    let cliente = await this.prisma.cliente.findFirst({
      where: { gimnasioId: gimnasio.id, email: { equals: dto.email.trim(), mode: 'insensitive' } },
    })
    if (!cliente || !cliente.activo) {
      throw new UnauthorizedException('Correo o contraseña incorrectos')
    }

    const claveValida = await bcrypt.compare(dto.password, cliente.passwordHash)
    if (!claveValida) {
      throw new UnauthorizedException('Correo o contraseña incorrectos')
    }

    // Socios enlazados con AdminPro: se refresca la membresía (si AdminPro no responde, queda la última conocida).
    // Si ya la dieron de baja allá, el socio queda inactivo y no entra.
    if (await this.membresias.sincronizar(cliente.id, { cacheMs: 0 })) {
      cliente = await this.prisma.cliente.findUniqueOrThrow({ where: { id: cliente.id } })
      if (!cliente.activo) throw new UnauthorizedException('Tu cuenta está desactivada. Habla con tu gimnasio.')
    }

    const tokens = await this.emitirTokens(cliente)
    return { cliente: this.aPerfilPublico(cliente, gimnasio, await this.pesoActualKg(cliente.id)), ...tokens }
  }

  /**
   * Activa la cuenta de un socio que el administrador dio de alta en AdminPro. El socio escribe el código del gimnasio, su
   * correo, el código de 6 dígitos que le llegó y la contraseña que quiere usar. Se verifica contra AdminPro, se crea la
   * cuenta enlazada (con su sucursal y su membresía) y queda con sesión iniciada.
   */
  async activar(dto: ActivarDto) {
    const gimnasio = await this.buscarGimnasioActivo(dto.codigoGimnasio)
    if (!gimnasio.adminIntegrado || !this.adminpro.disponible()) {
      throw new BadRequestException('Tu gimnasio todavía no tiene disponible la activación de cuentas')
    }

    const correo = dto.email.trim().toLowerCase()
    const yaTieneCuenta = await this.prisma.cliente.findFirst({
      where: { gimnasioId: gimnasio.id, email: { equals: correo, mode: 'insensitive' } },
      select: { id: true },
    })
    if (yaTieneCuenta) {
      throw new ConflictException('Ya activaste tu cuenta. Inicia sesión con tu correo y tu contraseña.')
    }

    let ficha
    try {
      ficha = await this.adminpro.validarActivacion(correo, dto.codigo)
    } catch (e) {
      if (e instanceof AdminProRechazo) {
        if (e.status === 401) {
          throw new BadRequestException('La activación no está configurada correctamente. Avisa a tu gimnasio.')
        }
        throw new BadRequestException(e.message)
      }
      if (e instanceof AdminProNoDisponible) {
        throw new ServiceUnavailableException('No pudimos comunicarnos con tu gimnasio. Inténtalo de nuevo en un momento.')
      }
      throw e
    }
    if (!ficha.activo) throw new BadRequestException('Tu cuenta de socio está inactiva. Habla con tu gimnasio.')

    // La cuenta de este socio ya pudo haberse creado con otro correo.
    const enlazado = await this.prisma.cliente.findUnique({ where: { adminClienteId: ficha.clienteId }, select: { id: true } })
    if (enlazado) throw new ConflictException('Esta cuenta de socio ya está activada. Inicia sesión.')

    // La sucursal del socio viene de AdminPro: se crea o se actualiza aquí.
    let sucursalId: string | null = null
    if (ficha.sucursal) {
      const sucursal = await this.prisma.sucursal.upsert({
        where: { adminSucursalId: ficha.sucursal.id },
        create: { gimnasioId: gimnasio.id, nombre: ficha.sucursal.nombre, adminSucursalId: ficha.sucursal.id },
        update: { nombre: ficha.sucursal.nombre },
      })
      sucursalId = sucursal.id
    }

    const passwordHash = await bcrypt.hash(dto.password, RONDAS_BCRYPT)
    const cliente = await this.prisma.cliente.create({
      data: {
        gimnasioId: gimnasio.id,
        nombres: ficha.nombres,
        apellidos: ficha.apellidos,
        email: correo,
        telefono: ficha.telefono ?? undefined,
        passwordHash,
        adminClienteId: ficha.clienteId,
        sucursalId,
        membresiaEstado: ficha.membresia.estado,
        membresiaPlan: ficha.membresia.plan,
        membresiaVenceEn: ficha.membresia.fechaVencimiento ? new Date(ficha.membresia.fechaVencimiento) : null,
        membresiaSincronizadaEn: new Date(),
      },
    })

    // Anula el código en AdminPro. Si esto falla la cuenta ya existe: el código vence solo y no se puede reutilizar
    // porque el correo ya tiene cuenta aquí.
    try {
      await this.adminpro.confirmarActivacion(ficha.clienteId)
    } catch (e) {
      this.logger.warn(`No se pudo confirmar la activación en AdminPro (${ficha.clienteId}): ${(e as Error).message}`)
    }

    const tokens = await this.emitirTokens(cliente)
    return { cliente: this.aPerfilPublico(cliente, gimnasio, null), ...tokens }
  }

  /** Vuelve a preguntar a AdminPro por la membresía (por ejemplo, después de renovar) y devuelve el perfil al día. */
  async actualizarMembresia(clienteId: string) {
    await this.membresias.sincronizar(clienteId, { cacheMs: 0 })
    return this.perfil(clienteId)
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
    await this.membresias.sincronizar(clienteId)
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      include: { gimnasio: true },
    })
    if (!cliente) throw new BadRequestException('Cliente no encontrado')
    return this.aPerfilPublico(cliente, cliente.gimnasio, await this.pesoActualKg(cliente.id))
  }

  /** Último peso registrado (onboarding o seguimiento): la app lo usa para ajustar las calorías estimadas. */
  private async pesoActualKg(clienteId: string): Promise<number | null> {
    const registro = await this.prisma.registroProgreso.findFirst({
      where: { clienteId, pesoKg: { not: null } },
      orderBy: { fecha: 'desc' },
      select: { pesoKg: true },
    })
    return registro?.pesoKg ?? null
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
      pesoObjetivoKg?: number | null
      adminClienteId?: string | null
      membresiaPlan?: string | null
      membresiaVenceEn?: Date | null
      fechaNacimiento?: Date | null
      unidadPeso?: string
      unidadAltura?: string
      restriccionFisica?: string | null
      preferenciaEntrenador?: string
      guiaDeVozActiva?: boolean
      cuentaAtrasSeg?: number
      volumenMusica?: number
      bajarVolumenConVoz?: boolean
      diasEntrenamientoSemana?: number[]
      calentamientoActivo?: boolean
      onboardingCompletado?: boolean
    },
    gimnasio: { nombre: string; codigo: string },
    pesoActualKg: number | null,
  ) {
    return {
      id: cliente.id,
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      email: cliente.email,
      gimnasioId: cliente.gimnasioId,
      gimnasio: gimnasio.nombre,
      gimnasioCodigo: gimnasio.codigo,
      telefono: cliente.telefono ?? null,
      alturaCm: cliente.alturaCm ?? null,
      pesoActualKg,
      pesoObjetivoKg: cliente.pesoObjetivoKg ?? null,
      // Solo los socios enlazados con AdminPro tienen membresía; el resto, null.
      membresia: cliente.adminClienteId ? resumenMembresia(cliente.membresiaVenceEn ?? null, cliente.membresiaPlan ?? null) : null,
      fechaNacimiento: cliente.fechaNacimiento ? cliente.fechaNacimiento.toISOString().slice(0, 10) : null,
      unidadPeso: cliente.unidadPeso ?? 'kg',
      unidadAltura: cliente.unidadAltura ?? 'cm',
      guiaDeVozActiva: cliente.guiaDeVozActiva ?? true,
      cuentaAtrasSeg: cliente.cuentaAtrasSeg ?? 5,
      volumenMusica: cliente.volumenMusica ?? 0.5,
      bajarVolumenConVoz: cliente.bajarVolumenConVoz ?? true,
      diasEntrenamientoSemana: cliente.diasEntrenamientoSemana ?? [],
      calentamientoActivo: cliente.calentamientoActivo ?? true,
      restriccionFisica: cliente.restriccionFisica ?? null,
      preferenciaEntrenador: cliente.preferenciaEntrenador ?? 'animacion',
      onboardingCompletado: cliente.onboardingCompletado ?? false,
    }
  }
}
