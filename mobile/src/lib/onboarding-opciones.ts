import type Ionicons from '@expo/vector-icons/Ionicons';

import type { ObjetivoPrincipal, ZonaLesion } from '@/context/onboarding-context';

type Icono = keyof typeof Ionicons.glyphMap;

export interface OpcionTarjeta<T> {
  valor: T;
  icono: Icono;
  titulo: string;
  descripcion: string;
}

export const OBJETIVOS: OpcionTarjeta<ObjetivoPrincipal>[] = [
  { valor: 'perdida_grasa', icono: 'flame-outline', titulo: 'Perder grasa', descripcion: 'Bajar de peso y definir tu cuerpo' },
  { valor: 'ganar_musculo', icono: 'barbell-outline', titulo: 'Ganar músculo', descripcion: 'Más fuerza y masa muscular' },
  { valor: 'tonificar', icono: 'body-outline', titulo: 'Tonificar', descripcion: 'Marcar y firmar sin ganar mucho volumen' },
  { valor: 'resistencia', icono: 'pulse-outline', titulo: 'Mejorar mi resistencia', descripcion: 'Más energía y mejor condición física' },
  { valor: 'salud', icono: 'heart-outline', titulo: 'Estar sano y activo', descripcion: 'Mantener el cuerpo en movimiento' },
];

export const CONOCIMIENTO: OpcionTarjeta<'principiante' | 'intermedio' | 'avanzado'>[] = [
  {
    valor: 'principiante',
    icono: 'layers-outline',
    titulo: 'Casi nada',
    descripcion: 'Soy nuevo: no conozco las máquinas ni los ejercicios',
  },
  {
    valor: 'intermedio',
    icono: 'layers',
    titulo: 'Lo básico',
    descripcion: 'Conozco los ejercicios principales y ya he entrenado antes',
  },
  {
    valor: 'avanzado',
    icono: 'trophy',
    titulo: 'Bastante',
    descripcion: 'Entreno con buena técnica y sé armar mi propia rutina',
  },
];

export const HISTORIAL: OpcionTarjeta<number>[] = [
  { valor: 0, icono: 'moon-outline', titulo: 'No entrené', descripcion: 'Hace tiempo que no hago ejercicio' },
  { valor: 1, icono: 'walk-outline', titulo: '1 vez por semana', descripcion: 'Entrenaba de vez en cuando' },
  { valor: 2, icono: 'bicycle-outline', titulo: '2 veces por semana', descripcion: 'Tenía una rutina suave' },
  { valor: 3, icono: 'barbell-outline', titulo: '3 veces por semana', descripcion: 'Entrenaba con constancia' },
  { valor: 4, icono: 'flame-outline', titulo: '4 o más veces por semana', descripcion: 'Entrenaba casi todos los días' },
];

export const NIVELES_ACTIVIDAD: { icono: Icono; texto: string }[] = [
  { icono: 'desktop-outline', texto: 'Paso el día en el escritorio' },
  { icono: 'walk-outline', texto: 'Me muevo o camino durante 30 minutos' },
  { icono: 'body-outline', texto: 'Entreno 1-2 veces por semana' },
  { icono: 'flame', texto: 'Hago ejercicio 3 o más veces por semana' },
];

export const FRECUENCIAS: OpcionTarjeta<number>[] = [
  { valor: 1, icono: 'leaf-outline', titulo: '1 vez por semana', descripcion: 'Para empezar con calma' },
  { valor: 2, icono: 'walk-outline', titulo: '2 veces por semana', descripcion: 'Un ritmo tranquilo y fácil de mantener' },
  { valor: 3, icono: 'barbell-outline', titulo: '3 veces por semana', descripcion: 'El equilibrio ideal para la mayoría' },
  { valor: 4, icono: 'trending-up-outline', titulo: '4 veces por semana', descripcion: 'Constancia para avanzar más rápido' },
  { valor: 5, icono: 'flame-outline', titulo: '5 veces por semana', descripcion: 'Mucha dedicación' },
  { valor: 6, icono: 'trophy-outline', titulo: '6 veces por semana', descripcion: 'Alto rendimiento' },
];

/** Días sugeridos (0 = domingo ... 6 = sábado) para cada frecuencia, repartidos para dar descanso. */
export const DIAS_SUGERIDOS: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

/** Los días en el orden en que se muestran (la semana empieza el lunes). `valor` es el que usa el servidor. */
export const DIAS_SEMANA: { valor: number; corto: string; nombre: string }[] = [
  { valor: 1, corto: 'Lun', nombre: 'Lunes' },
  { valor: 2, corto: 'Mar', nombre: 'Martes' },
  { valor: 3, corto: 'Mié', nombre: 'Miércoles' },
  { valor: 4, corto: 'Jue', nombre: 'Jueves' },
  { valor: 5, corto: 'Vie', nombre: 'Viernes' },
  { valor: 6, corto: 'Sáb', nombre: 'Sábado' },
  { valor: 0, corto: 'Dom', nombre: 'Domingo' },
];

export const ZONAS: { valor: ZonaLesion; etiqueta: string; icono: Icono }[] = [
  { valor: 'cuello', etiqueta: 'Cuello', icono: 'person-outline' },
  { valor: 'hombro', etiqueta: 'Hombro', icono: 'body-outline' },
  { valor: 'codo', etiqueta: 'Codo', icono: 'hand-left-outline' },
  { valor: 'muneca', etiqueta: 'Muñeca', icono: 'hand-right-outline' },
  { valor: 'espalda_baja', etiqueta: 'Espalda baja', icono: 'fitness-outline' },
  { valor: 'cadera', etiqueta: 'Cadera', icono: 'accessibility-outline' },
  { valor: 'rodilla', etiqueta: 'Rodilla', icono: 'walk-outline' },
  { valor: 'tobillo', etiqueta: 'Tobillo', icono: 'footsteps-outline' },
];

export const RESTRICCIONES: OpcionTarjeta<'ninguna' | 'impacto_bajo' | 'sin_saltos'>[] = [
  { valor: 'ninguna', icono: 'body-outline', titulo: 'No, estoy bien', descripcion: 'Puedo hacer cualquier tipo de ejercicio' },
  { valor: 'impacto_bajo', icono: 'walk-outline', titulo: 'Impacto bajo', descripcion: 'Apto para gente con sobrepeso' },
  { valor: 'sin_saltos', icono: 'footsteps-outline', titulo: 'Sin saltos', descripcion: 'Sin ruidos, apto para apartamentos' },
];

/** "18:00" -> "6:00 p. m." */
export function horaLegible(hora: string): string {
  const [h, m] = hora.split(':').map(Number);
  const sufijo = h >= 12 ? 'p. m.' : 'a. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${sufijo}`;
}
