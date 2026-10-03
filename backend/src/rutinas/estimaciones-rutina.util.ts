// Estimaciones de duración y calorías de una rutina.
//
// IMPORTANTE: mobile/src/lib/rutina-utils.ts usa la MISMA fórmula (la app la
// necesita en el momento, al editar una rutina, sin esperar al servidor). Si
// cambias una, cambia la otra. `estimaciones-rutina.util.spec.ts` fija los
// valores esperados para que un cambio no pase desapercibido.
//
// Calorías: `ejercicio.caloriasPorMinuto` son kcal por minuto de una persona de
// PESO_REFERENCIA_KG, promediadas sobre el bloque completo (trabajo + descanso),
// que es como los miden las tablas de METs (Compendium of Physical Activities).
// Contar solo el tiempo de trabajo subestimaba las calorías 3 o 4 veces.

export const PESO_REFERENCIA_KG = 70

type ItemRutina = {
  series: number | null
  repeticiones: number | null
  duracionSeg: number | null
  descansoSeg: number | null
  ejercicio: { caloriasPorMinuto: number | null }
}

/** Segundos que dura un ejercicio de la rutina entero: todas sus series, con el descanso. */
function segundosDelBloque(item: ItemRutina): number {
  const trabajo = item.duracionSeg ?? (item.repeticiones ?? 10) * 3
  const series = item.series ?? 1
  return trabajo * series + (item.descansoSeg ?? 20) * series
}

/** Una persona más pesada gasta más: se escala desde el peso de referencia (entre 0,5x y 2x). */
function factorDePeso(pesoKg?: number | null): number {
  if (!pesoKg || pesoKg <= 0) return 1
  return Math.min(2, Math.max(0.5, pesoKg / PESO_REFERENCIA_KG))
}

export function duracionEstimadaMin(rutina: { ejercicios: ItemRutina[] }): number {
  const segundos = rutina.ejercicios.reduce((suma, item) => suma + segundosDelBloque(item), 0)
  return Math.max(1, Math.round(segundos / 60))
}

export function caloriasEstimadasDeRutina(rutina: { ejercicios: ItemRutina[] }, pesoKg?: number | null): number {
  const calorias = rutina.ejercicios.reduce(
    (suma, item) => suma + (segundosDelBloque(item) / 60) * (item.ejercicio.caloriasPorMinuto ?? 5),
    0,
  )
  return Math.round(calorias * factorDePeso(pesoKg))
}

/**
 * Calorías de un entrenamiento ya hecho: el ritmo medio de la rutina (kcal/min) por los
 * minutos que de verdad duró. Se limita a 1,5 veces lo estimado para que dejar la app
 * en pausa no infle el resultado.
 */
export function caloriasDeSesion(
  rutina: { ejercicios: ItemRutina[] },
  duracionRealMin: number,
  pesoKg?: number | null,
): number {
  const estimadoMin = duracionEstimadaMin(rutina)
  const minutos = Math.min(Math.max(0, duracionRealMin), estimadoMin * 1.5)
  return Math.round((caloriasEstimadasDeRutina(rutina, pesoKg) / estimadoMin) * minutos)
}
