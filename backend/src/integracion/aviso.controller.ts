import { Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from '@nestjs/common'
import { timingSafeEqual } from 'node:crypto'
import { IsString, Length } from 'class-validator'
import { PrismaService } from '../prisma/prisma.service.js'
import { MembresiaService } from './membresia.service.js'

class AvisoDto {
  @IsString()
  @Length(1, 64)
  clienteId!: string
}

/**
 * AdminPro avisa aquí cuando cambia algo de un socio (membresía, datos, sucursal, baja) para que la app lo vuelva a
 * consultar enseguida. El aviso solo trae el id del socio: los datos se piden a AdminPro, así que un aviso falso, a lo
 * sumo, provoca una consulta de más. Se autentica con `x-aviso-clave` (ADMINPRO_AVISO_CLAVE).
 */
@Controller('integracion')
export class AvisoController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membresias: MembresiaService,
  ) {}

  @Post('aviso')
  @HttpCode(200)
  async aviso(@Headers('x-aviso-clave') clave: string | undefined, @Body() dto: AvisoDto) {
    const esperada = process.env.ADMINPRO_AVISO_CLAVE
    const a = Buffer.from(clave ?? '')
    const b = Buffer.from(esperada ?? '')
    if (!esperada || a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException()

    const cliente = await this.prisma.cliente.findUnique({ where: { adminClienteId: dto.clienteId }, select: { id: true } })
    // Sin importar si el socio existe aquí, se responde igual.
    if (cliente) await this.membresias.sincronizar(cliente.id, { cacheMs: 0 })
    return { ok: true }
  }
}
