import { describe, expect, it } from 'vitest'

import { caloriasEstimadasDeRutina, duracionEstimadaMin } from './estimaciones-rutina.util.js'

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

  it('calcula las calorías', () => {
    // (36*3/60)*8 + (30*2/60)*5 = 14.4 + 5 = 19.4 -> 19
    expect(caloriasEstimadasDeRutina(rutina)).toBe(19)
  })

  it('usa valores por defecto cuando faltan datos', () => {
    const vacia = { ejercicios: [{ series: null, repeticiones: null, duracionSeg: null, descansoSeg: null, ejercicio: { caloriasPorMinuto: null } }] }
    // 10 reps x 3 s + 20 s de descanso = 50 s -> 1 min; 30 s * 6 kcal/min = 3
    expect(duracionEstimadaMin(vacia)).toBe(1)
    expect(caloriasEstimadasDeRutina(vacia)).toBe(3)
  })

  it('nunca devuelve menos de 1 minuto', () => {
    expect(duracionEstimadaMin({ ejercicios: [] })).toBe(1)
  })
})
