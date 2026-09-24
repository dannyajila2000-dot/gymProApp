import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface ClienteAutenticado {
  clienteId: string
  gimnasioId: string
  email: string
}

export const ClienteActual = createParamDecorator((_: unknown, ctx: ExecutionContext): ClienteAutenticado => {
  const request = ctx.switchToHttp().getRequest()
  return request.user
})
