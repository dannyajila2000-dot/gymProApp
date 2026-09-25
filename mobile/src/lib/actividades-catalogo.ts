export interface ActividadCatalogo {
  nombre: string;
  icono: string;
  caloriasPorMinuto: number;
  tieneDistancia: boolean;
}

export const CATALOGO_ACTIVIDADES: ActividadCatalogo[] = [
  { nombre: 'Correr', icono: 'walk', caloriasPorMinuto: 11, tieneDistancia: true },
  { nombre: 'Caminar', icono: 'walk-outline', caloriasPorMinuto: 5, tieneDistancia: true },
  { nombre: 'Ciclismo', icono: 'bicycle', caloriasPorMinuto: 8, tieneDistancia: true },
  { nombre: 'Natación', icono: 'water', caloriasPorMinuto: 9, tieneDistancia: true },
  { nombre: 'Yoga', icono: 'body', caloriasPorMinuto: 3, tieneDistancia: false },
  { nombre: 'Pilates', icono: 'body-outline', caloriasPorMinuto: 4, tieneDistancia: false },
  { nombre: 'Baile', icono: 'musical-notes', caloriasPorMinuto: 6, tieneDistancia: false },
  { nombre: 'Fútbol', icono: 'football', caloriasPorMinuto: 9, tieneDistancia: false },
  { nombre: 'Básquetbol', icono: 'basketball', caloriasPorMinuto: 8, tieneDistancia: false },
  { nombre: 'Tenis', icono: 'tennisball', caloriasPorMinuto: 7, tieneDistancia: false },
  { nombre: 'Boxeo', icono: 'hand-left', caloriasPorMinuto: 10, tieneDistancia: false },
  { nombre: 'Escalada', icono: 'trending-up', caloriasPorMinuto: 8, tieneDistancia: false },
  { nombre: 'Remo', icono: 'boat', caloriasPorMinuto: 8, tieneDistancia: false },
  { nombre: 'Saltar cuerda', icono: 'infinite', caloriasPorMinuto: 12, tieneDistancia: false },
  { nombre: 'Senderismo', icono: 'trail-sign', caloriasPorMinuto: 6, tieneDistancia: true },
  { nombre: 'Estiramiento', icono: 'accessibility', caloriasPorMinuto: 2, tieneDistancia: false },
  { nombre: 'Otro', icono: 'ellipsis-horizontal', caloriasPorMinuto: 6, tieneDistancia: false },
];
