import { solicitar } from './client';

export interface RegistroProgreso {
  id: string;
  fecha: string;
  pesoKg: number | null;
  grasaCorporalPct: number | null;
  medidas: Record<string, number> | null;
  fotoUrl: string | null;
}

export function listarProgreso() {
  return solicitar<RegistroProgreso[]>('/progreso', { autenticado: true });
}

export function registrarProgreso(datos: {
  pesoKg?: number;
  grasaCorporalPct?: number;
  medidas?: Record<string, number>;
}) {
  return solicitar<RegistroProgreso>('/progreso', {
    metodo: 'POST',
    autenticado: true,
    cuerpo: datos,
  });
}

export function actualizarAltura(alturaCm: number) {
  return solicitar<{ alturaCm: number }>('/progreso/altura', {
    metodo: 'PUT',
    autenticado: true,
    cuerpo: { alturaCm },
  });
}

export function actualizarPesoObjetivo(pesoObjetivoKg: number) {
  return solicitar<{ pesoObjetivoKg: number }>('/progreso/peso-objetivo', {
    metodo: 'PUT',
    autenticado: true,
    cuerpo: { pesoObjetivoKg },
  });
}

export interface MetaSeguimiento {
  clienteId: string;
  caloriasQuemarObjetivo: number;
  duracionObjetivoMin: number;
  pasosObjetivo: number;
  pasosActivo: boolean;
}

export function obtenerMetaSeguimiento() {
  return solicitar<MetaSeguimiento>('/progreso/meta-seguimiento', { autenticado: true });
}

export function actualizarMetaSeguimiento(datos: Partial<Omit<MetaSeguimiento, 'clienteId'>>) {
  return solicitar<MetaSeguimiento>('/progreso/meta-seguimiento', {
    metodo: 'PUT',
    autenticado: true,
    cuerpo: datos,
  });
}

export function pasosDeHoy(fecha?: string) {
  const query = fecha ? `?fecha=${fecha}` : '';
  return solicitar<{ total: number }>(`/progreso/pasos${query}`, { autenticado: true });
}

export function registrarPasos(cantidad: number) {
  return solicitar<{ id: string }>('/progreso/pasos', {
    metodo: 'POST',
    autenticado: true,
    cuerpo: { cantidad },
  });
}

export function pasosPorSemana(fecha?: string) {
  const query = fecha ? `?fecha=${fecha}` : '';
  return solicitar<number[]>(`/progreso/pasos/semana${query}`, { autenticado: true });
}

export interface ActividadLibre {
  id: string;
  nombre: string;
  duracionMin: number;
  distanciaM: number | null;
  caloriasEstimadas: number;
  fecha: string;
}

export function listarActividades() {
  return solicitar<ActividadLibre[]>('/progreso/actividades', { autenticado: true });
}

export function registrarActividad(datos: {
  nombre: string;
  duracionMin: number;
  distanciaM?: number;
  caloriasEstimadas: number;
}) {
  return solicitar<ActividadLibre>('/progreso/actividades', {
    metodo: 'POST',
    autenticado: true,
    cuerpo: datos,
  });
}

export function eliminarActividad(id: string) {
  return solicitar<{ count: number }>(`/progreso/actividades/${id}`, {
    metodo: 'DELETE',
    autenticado: true,
  });
}

export interface ResumenHoy {
  caloriasQuemadas: number;
  duracionMin: number;
  pasos: number;
  meta: MetaSeguimiento;
}

export function resumenDeHoy(fecha?: string) {
  const query = fecha ? `?fecha=${fecha}` : '';
  return solicitar<ResumenHoy>(`/progreso/resumen/hoy${query}`, { autenticado: true });
}

export interface ResumenSemana {
  entrenamientos: number;
  caloriasTotales: number;
  minutosTotales: number;
  diasCompletados: number[];
  racha: number;
}

export function resumenDeLaSemana(fecha?: string) {
  const query = fecha ? `?fecha=${fecha}` : '';
  return solicitar<ResumenSemana>(`/progreso/resumen/semana${query}`, { autenticado: true });
}
