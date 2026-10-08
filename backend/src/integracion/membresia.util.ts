import { fechaDeHoyEcuador } from '../common/fecha-ecuador.util.js'
import type { EstadoMembresia } from './adminpro.client.js'

export type { EstadoMembresia }

/** Mismo umbral que AdminPro: a 7 días o menos del vencimiento, la membresía está "por vencer". */
export const UMBRAL_POR_VENCER_DIAS = 7

export type ResumenMembresia = {
  estado: EstadoMembresia
  plan: string | null
  venceEn: string | null
  diasRestantes: number | null
}

/**
 * Días que faltan hasta el vencimiento (0 = vence hoy, negativo = ya venció). AdminPro guarda el vencimiento como
 * un instante exacto (hora de la renovación + los días del plan), así que se pasa a la fecha de Ecuador (UTC-5)
 * antes de contar; con la fecha UTC, una renovación de noche en Ecuador ya cae al día siguiente y suma un día de más.
 */
export function diasHastaVencimiento(venceEn: Date, hoy = fechaDeHoyEcuador()): number {
  const vence = new Date(venceEn.getTime() - 5 * 3_600_000).toISOString().slice(0, 10)
  return Math.round((Date.parse(`${vence}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / 86_400_000)
}

/**
 * Estado de la membresía calculado con la fecha de vencimiento guardada. Se recalcula en cada uso (no se confía en
 * el estado que se guardó al sincronizar) para que una membresía que vence hoy se bloquee sin esperar otra consulta.
 */
export function resumenMembresia(venceEn: Date | null, plan: string | null, hoy?: string): ResumenMembresia {
  if (!venceEn) return { estado: 'sin_membresia', plan, venceEn: null, diasRestantes: null }
  const dias = diasHastaVencimiento(venceEn, hoy)
  const estado: EstadoMembresia = dias < 0 ? 'vencido' : dias <= UMBRAL_POR_VENCER_DIAS ? 'por_vencer' : 'activo'
  return { estado, plan, venceEn: venceEn.toISOString(), diasRestantes: dias }
}

/** Con la membresía vencida, o sin ninguna, la app no se puede usar. */
export function bloqueaAcceso(estado: EstadoMembresia): boolean {
  return estado === 'vencido' || estado === 'sin_membresia'
}
