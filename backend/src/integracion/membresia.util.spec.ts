import { describe, expect, it } from 'vitest'

import { bloqueaAcceso, diasHastaVencimiento, resumenMembresia } from './membresia.util.js'

const fecha = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

describe('membresía del socio', () => {
  it('sin fecha de vencimiento es "sin_membresia"', () => {
    expect(resumenMembresia(null, null, '2026-10-10').estado).toBe('sin_membresia')
  })

  it('más de 7 días: activa', () => {
    const r = resumenMembresia(fecha('2026-10-20'), 'Mensual', '2026-10-10')
    expect(r).toMatchObject({ estado: 'activo', plan: 'Mensual', diasRestantes: 10 })
  })

  it('7 días o menos: por vencer, y el día de vencimiento todavía vale', () => {
    expect(resumenMembresia(fecha('2026-10-17'), 'Mensual', '2026-10-10').estado).toBe('por_vencer')
    const hoy = resumenMembresia(fecha('2026-10-10'), 'Mensual', '2026-10-10')
    expect(hoy).toMatchObject({ estado: 'por_vencer', diasRestantes: 0 })
    expect(bloqueaAcceso(hoy.estado)).toBe(false)
  })

  it('al día siguiente del vencimiento está vencida y bloquea', () => {
    const r = resumenMembresia(fecha('2026-10-10'), 'Mensual', '2026-10-11')
    expect(r).toMatchObject({ estado: 'vencido', diasRestantes: -1 })
    expect(bloqueaAcceso(r.estado)).toBe(true)
  })

  it('sin membresía también bloquea; activa y por vencer no', () => {
    expect(bloqueaAcceso('sin_membresia')).toBe(true)
    expect(bloqueaAcceso('activo')).toBe(false)
    expect(bloqueaAcceso('por_vencer')).toBe(false)
  })

  it('cuenta los días por la fecha UTC del vencimiento (como AdminPro) y no se corre por la zona horaria', () => {
    // Medianoche UTC del 15: en Ecuador (UTC-5) sería la tarde del 14, pero el vencimiento sigue siendo "el 15".
    expect(diasHastaVencimiento(new Date('2026-10-15T00:00:00.000Z'), '2026-10-10')).toBe(5)
    expect(diasHastaVencimiento(new Date('2026-10-15T05:00:00.000Z'), '2026-10-10')).toBe(5)
  })
})
