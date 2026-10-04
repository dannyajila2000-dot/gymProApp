import { HttpException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { describe, expect, it } from 'vitest'

import { LimiteIntentos, LimiteIntentosGuard } from './limite-intentos.guard.js'

// Contexto mínimo de Nest para probar el guard sin levantar el servidor.
class Controlador {
  @LimiteIntentos({ por: 'email', max: 3, ventanaSeg: 600 })
  login() {}

  @LimiteIntentos({ por: 'ip', max: 2, ventanaSeg: 600 })
  registro() {}

  sinLimite() {}
}

function contexto(metodo: keyof Controlador, peticion: { ip?: string; body?: { email?: string } }) {
  const cabeceras: Record<string, string> = {}
  return {
    ctx: {
      getHandler: () => Controlador.prototype[metodo],
      getClass: () => Controlador,
      switchToHttp: () => ({
        getRequest: () => peticion,
        getResponse: () => ({ setHeader: (k: string, v: string) => (cabeceras[k] = v) }),
      }),
    } as never,
    cabeceras,
  }
}

describe('LimiteIntentosGuard', () => {
  it('deja pasar hasta el máximo y bloquea el siguiente con 429 y Retry-After', () => {
    const guard = new LimiteIntentosGuard(new Reflector())
    const peticion = { ip: '1.1.1.1', body: { email: 'a@x.com' } }
    for (let i = 0; i < 3; i++) expect(guard.canActivate(contexto('login', peticion).ctx)).toBe(true)

    const { ctx, cabeceras } = contexto('login', peticion)
    try {
      guard.canActivate(ctx)
      expect.unreachable('debía bloquear')
    } catch (e) {
      expect((e as HttpException).getStatus()).toBe(429)
      expect(Number(cabeceras['Retry-After'])).toBeGreaterThan(0)
    }
  })

  it('el límite por correo no depende de la IP ni distingue mayúsculas', () => {
    const guard = new LimiteIntentosGuard(new Reflector())
    for (let i = 0; i < 3; i++) guard.canActivate(contexto('login', { ip: `9.9.9.${i}`, body: { email: 'Ana@X.com ' } }).ctx)
    expect(() => guard.canActivate(contexto('login', { ip: '8.8.8.8', body: { email: 'ana@x.com' } }).ctx)).toThrow(HttpException)
  })

  it('otra cuenta no se ve afectada', () => {
    const guard = new LimiteIntentosGuard(new Reflector())
    for (let i = 0; i < 3; i++) guard.canActivate(contexto('login', { ip: '1.1.1.1', body: { email: 'a@x.com' } }).ctx)
    expect(guard.canActivate(contexto('login', { ip: '1.1.1.1', body: { email: 'b@x.com' } }).ctx)).toBe(true)
  })

  it('limita por IP donde se pide por IP, y las rutas sin regla no se limitan', () => {
    const guard = new LimiteIntentosGuard(new Reflector())
    guard.canActivate(contexto('registro', { ip: '2.2.2.2' }).ctx)
    guard.canActivate(contexto('registro', { ip: '2.2.2.2' }).ctx)
    expect(() => guard.canActivate(contexto('registro', { ip: '2.2.2.2' }).ctx)).toThrow(HttpException)
    for (let i = 0; i < 50; i++) expect(guard.canActivate(contexto('sinLimite', { ip: '2.2.2.2' }).ctx)).toBe(true)
  })
})
