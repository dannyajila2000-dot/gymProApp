import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'

@Injectable()
export class ProgresoService {
  constructor(private readonly prisma: PrismaService) {}

  listar(clienteId: string) {
    return this.prisma.registroProgreso.findMany({
      where: { clienteId },
      orderBy: { fecha: 'desc' },
    })
  }

  registrar(
    clienteId: string,
    datos: { pesoKg?: number; grasaCorporalPct?: number; medidas?: Record<string, number>; fotoUrl?: string },
  ) {
    return this.prisma.registroProgreso.create({
      data: {
        clienteId,
        pesoKg: datos.pesoKg,
        grasaCorporalPct: datos.grasaCorporalPct,
        medidas: datos.medidas,
        fotoUrl: datos.fotoUrl,
      },
    })
  }

  async actualizarAltura(clienteId: string, alturaCm: number) {
    const cliente = await this.prisma.cliente.update({
      where: { id: clienteId },
      data: { alturaCm },
    })
    return { alturaCm: cliente.alturaCm }
  }
}
