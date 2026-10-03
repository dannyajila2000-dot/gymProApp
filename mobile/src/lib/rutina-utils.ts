import type { Rutina, RutinaEjercicio } from '@/api/rutinas';

// Misma fórmula que backend/src/rutinas/estimaciones-rutina.util.ts (aquí se
// necesita al instante, al editar una rutina). Si cambias una, cambia la otra;
// el test del backend fija los valores esperados.
//
// `caloriasPorMinuto` son kcal/min de una persona de 70 kg, promediadas sobre el bloque
// completo (trabajo + descanso), como lo miden las tablas de METs.

const PESO_REFERENCIA_KG = 70;

/** Segundos que dura un ejercicio de la rutina entero: todas sus series, con el descanso. */
function segundosDelBloque(item: RutinaEjercicio): number {
  const trabajo = item.duracionSeg ?? (item.repeticiones ?? 10) * 3;
  const series = item.series ?? 1;
  return trabajo * series + (item.descansoSeg ?? 20) * series;
}

/** Una persona más pesada gasta más: se escala desde el peso de referencia (entre 0,5x y 2x). */
function factorDePeso(pesoKg?: number | null): number {
  if (!pesoKg || pesoKg <= 0) return 1;
  return Math.min(2, Math.max(0.5, pesoKg / PESO_REFERENCIA_KG));
}

export function duracionEstimadaMin(rutina: Rutina): number {
  const segundos = rutina.ejercicios.reduce((suma, item) => suma + segundosDelBloque(item), 0);
  return Math.max(1, Math.round(segundos / 60));
}

export function caloriasEstimadas(rutina: Rutina, pesoKg?: number | null): number {
  const calorias = rutina.ejercicios.reduce(
    (suma, item) => suma + (segundosDelBloque(item) / 60) * (item.ejercicio.caloriasPorMinuto ?? 5),
    0,
  );
  return Math.round(calorias * factorDePeso(pesoKg));
}
