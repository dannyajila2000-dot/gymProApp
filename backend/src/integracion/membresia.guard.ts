import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { bloqueaAcceso, resumenMembresia } from './membresia.util.js'
import { MembresiaService } from './membresia.service.js'

/**
 * Bloquea el uso de la app cuando la membresía del socio venció (o no tiene ninguna). Se usa junto a JwtAuthGuard.
 * Solo aplica a socios enlazados con AdminPro: las cuentas anteriores a la integración no se tocan.
 *
 * Responde 403 con `codigo: 'MEMBRESIA_VENCIDA'` para que la app muestre la pantalla de renovación.
 */
@Injectable()
export class MembresiaGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membresias: MembresiaService,
  ) {}

  private leer(clienteId: string) {
    return this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { activo: true, adminClienteId: true, membresiaVenceEn: true, membresiaPlan: true },
    })
  }

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const clienteId: string | undefined = contexto.switchToHttp().getRequest().user?.clienteId
    if (!clienteId) return true // sin sesión lo rechaza JwtAuthGuard

    let cliente = await this.leer(clienteId)
    if (!cliente) throw new UnauthorizedException('Sesión inválida, vuelve a iniciar sesión')
    if (!cliente.activo) throw new UnauthorizedException('Tu cuenta está desactivada. Habla con tu gimnasio.')
    if (!cliente.adminClienteId) return true

    let resumen = resumenMembresia(cliente.membresiaVenceEn, cliente.membresiaPlan)
    if (!bloqueaAcceso(resumen.estado)) return true

    // Antes de bloquear, se comprueba que no la hayan renovado hace un momento (como mucho una consulta por minuto).
    if (await this.membresias.sincronizar(clienteId, { cacheMs: 60_000 })) {
      cliente = await this.leer(clienteId)
      if (!cliente?.activo) throw new UnauthorizedException('Tu cuenta está desactivada. Habla con tu gimnasio.')
      resumen = resumenMembresia(cliente.membresiaVenceEn, cliente.membresiaPlan)
      if (!bloqueaAcceso(resumen.estado)) return true
    }

    throw new ForbiddenException({
      statusCode: 403,
      codigo: 'MEMBRESIA_VENCIDA',
      message:
        resumen.estado === 'sin_membresia'
          ? 'Aún no tienes una membresía activa. Consúltala en tu gimnasio.'
          : 'Tu membresía venció. Renuévala en tu gimnasio para seguir entrenando.',
      membresia: resumen,
    })
  }
}
