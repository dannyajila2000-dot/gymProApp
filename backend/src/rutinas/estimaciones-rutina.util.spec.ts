import { describe, expect, it } from 'vitest'

import { caloriasDeSesion, caloriasEstimadasDeRutina, duracionEstimadaMin } from './estimaciones-rutina.util.js'

const rutina = {
  ejercicios: [
    // 12 reps x 3 s = 36 s de trabajo + 60 s de descanso, por 3 series
    { series: 3, repeticiones: 12, duracionSeg: null, descansoSeg: 60, ejercicio: { caloriasPorMinuto: 8 } },
    // 30 s de trabajo + 30 s de descanso, por 2 series
    { series: 2, repeticiones: null, duracionSeg: 30, descansoSeg: 30, ejercicio: { caloriasPorMinuto: 5 } },
  ],
}

describe('estimaciones de rutina', () => {
  it('calcula la duración en minutos', () => {
    // (36*3 + 60*3) + (30*2 + 30*2) = 288 + 120 = 408 s -> 6.8 min -> 7
    expect(duracionEstimadaMin(rutina)).toBe(7)
  })

  it('calcula las calorías sobre el bloque completo, descanso incluido', () => {
    // (288/60)*8 + (120/60)*5 = 38.4 + 10 = 48.4 -> 48
    expect(caloriasEstimadasDeRutina(rutina)).toBe(48)
  })

  it('escala las calorías por el peso respecto a 70 kg', () => {
    expect(caloriasEstimadasDeRutina(rutina, 70)).toBe(48)
    expect(caloriasEstimadasDeRutina(rutina, 105)).toBe(73) // x1.5
    expect(caloriasEstimadasDeRutina(rutina, 0)).toBe(48) // peso inválido: sin escalar
  })

  it('usa valores por defecto cuando faltan datos', () => {
    const vacia = { ejercicios: [{ series: null, repeticiones: null, duracionSeg: null, descansoSeg: null, ejercicio: { caloriasPorMinuto: null } }] }
    // 10 reps x 3 s + 20 s de descanso = 50 s -> 1 min; (50/60) min * 5 kcal/min = 4.2 -> 4
    expect(duracionEstimadaMin(vacia)).toBe(1)
    expect(caloriasEstimadasDeRutina(vacia)).toBe(4)
  })

  it('nunca devuelve menos de 1 minuto', () => {
    expect(duracionEstimadaMin({ ejercicios: [] })).toBe(1)
  })

  it('una sesión más corta de lo estimado gasta menos, proporcionalmente', () => {
    // 48 kcal en 7 min estimados: a 3.5 min real, la mitad
    expect(caloriasDeSesion(rutina, 3.5)).toBe(24)
  })

  it('una sesión demasiado larga (app en pausa) se limita a 1,5x lo estimado', () => {
    // 7 min * 1.5 = 10.5 min -> 48/7 * 10.5 = 72
    expect(caloriasDeSesion(rutina, 120)).toBe(72)
  })
})
