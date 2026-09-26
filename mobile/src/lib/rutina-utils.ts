import type { Rutina } from '@/api/rutinas';

export function duracionEstimadaMin(rutina: Rutina): number {
  const segundos = rutina.ejercicios.reduce((suma, item) => {
    const trabajo = item.duracionSeg ?? (item.repeticiones ?? 10) * 3;
    const series = item.series ?? 1;
    return suma + trabajo * series + (item.descansoSeg ?? 20) * series;
  }, 0);
  return Math.max(1, Math.round(segundos / 60));
}

export function caloriasEstimadas(rutina: Rutina): number {
  const calorias = rutina.ejercicios.reduce((suma, item) => {
    const minutos = item.duracionSeg
      ? (item.duracionSeg * (item.series ?? 1)) / 60
      : ((item.repeticiones ?? 10) * (item.series ?? 1) * 3) / 60;
    return suma + minutos * (item.ejercicio.caloriasPorMinuto ?? 6);
  }, 0);
  return Math.round(calorias);
}
