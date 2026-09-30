// Estimaciones de duración y calorías de una rutina.
//
// IMPORTANTE: mobile/src/lib/rutina-utils.ts usa la MISMA fórmula (la app la
// necesita en el momento, al editar una rutina, sin esperar al servidor). Si
// cambias una, cambia la otra. `estimaciones-rutina.util.spec.ts` fija los
// valores esperados para que un cambio no pase desapercibido.

type ItemRutina = {
  series: number | null
  repeticiones: number | null
  duracionSeg: number | null
  descansoSeg: number | null
  ejercicio: { caloriasPorMinuto: number | null }
}

export function duracionEstimadaMin(rutina: { ejercicios: ItemRutina[] }): number {
  const segundos = rutina.ejercicios.reduce((suma, item) => {
    const trabajo = item.duracionSeg ?? (item.repeticiones ?? 10) * 3
    const series = item.series ?? 1
    return suma + trabajo * series + (item.descansoSeg ?? 20) * series
  }, 0)
  return Math.max(1, Math.round(segundos / 60))
}

export function caloriasEstimadasDeRutina(rutina: { ejercicios: ItemRutina[] }): number {
  const calorias = rutina.ejercicios.reduce((suma, item) => {
    const minutos = item.duracionSeg
      ? (item.duracionSeg * (item.series ?? 1)) / 60
      : ((item.repeticiones ?? 10) * (item.series ?? 1) * 3) / 60
    return suma + minutos * (item.ejercicio.caloriasPorMinuto ?? 6)
  }, 0)
  return Math.round(calorias)
}
