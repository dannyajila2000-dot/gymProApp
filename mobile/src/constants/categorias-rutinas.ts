import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { Rutina } from '@/api/rutinas';
import { duracionEstimadaMin } from '@/lib/rutina-utils';

type IconoIonicons = ComponentProps<typeof Ionicons>['name'];

// Las categorías son el `objetivo` de la rutina. Se muestran en Descubre como
// carruseles (CATEGORIAS_CARRUSEL) o como círculos de "Zona principal" (ZONAS).
export const CATEGORIAS: Record<string, { titulo: string; icono: IconoIonicons }> = {
  calentamiento: { titulo: 'Estiramientos y Calentamiento', icono: 'body-outline' },
  perdida_grasa: { titulo: 'Quema de grasa', icono: 'flame-outline' },
  fuerza: { titulo: 'Fuerza y tono', icono: 'barbell-outline' },
  cardio: { titulo: 'Cardio', icono: 'pulse-outline' },
  cuerpo_completo: { titulo: 'Todo el cuerpo', icono: 'body-outline' },
  core: { titulo: 'Abdominales', icono: 'fitness-outline' },
  tren_superior: { titulo: 'Tren superior', icono: 'hand-left-outline' },
  tren_inferior: { titulo: 'Tren inferior', icono: 'walk-outline' },
};

export const ZONAS = ['cuerpo_completo', 'core', 'tren_superior', 'tren_inferior'];
export const CATEGORIAS_CARRUSEL = ['calentamiento', 'perdida_grasa', 'fuerza', 'cardio'];

export const CATEGORIA_PARA_TI = 'para-ti';
export const CATEGORIA_MIS_RUTINAS = 'mias';

export const DURACIONES: Record<string, { titulo: string; cumple: (min: number) => boolean }> = {
  corta: { titulo: 'Hasta 10 min', cumple: (min) => min <= 10 },
  media: { titulo: '10 a 20 min', cumple: (min) => min > 10 && min <= 20 },
  larga: { titulo: 'Más de 20 min', cumple: (min) => min > 20 },
};

export function cumpleDuracion(rutina: Rutina, clave: string | undefined) {
  const duracion = clave ? DURACIONES[clave] : undefined;
  return !duracion || duracion.cumple(duracionEstimadaMin(rutina));
}
