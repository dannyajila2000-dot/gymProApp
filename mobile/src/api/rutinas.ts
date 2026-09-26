import { solicitar } from './client';

export type PatronMovimiento =
  | 'sentadilla'
  | 'press'
  | 'remo'
  | 'curl'
  | 'salto'
  | 'abdominal'
  | 'plancha'
  | 'pantorrilla';

export interface Ejercicio {
  id: string;
  nombre: string;
  grupoMuscular: string;
  tipoMedida: 'repeticiones' | 'duracion';
  patronMovimiento: PatronMovimiento;
  descripcion: string | null;
  gifUrl: string | null;
  caloriasPorMinuto: number | null;
}

export interface RutinaEjercicio {
  id: string;
  orden: number;
  series: number | null;
  repeticiones: number | null;
  duracionSeg: number | null;
  descansoSeg: number | null;
  ejercicio: Ejercicio;
}

export interface Rutina {
  id: string;
  nombre: string;
  nivel: 'principiante' | 'intermedio' | 'avanzado';
  objetivo: string;
  descripcion: string | null;
  imagenUrl: string | null;
  ejercicios: RutinaEjercicio[];
}

export interface SesionEntrenamiento {
  id: string;
  rutinaId: string;
  completadaEn: string;
  duracionMin: number;
  caloriasEstimadas: number;
  rutina: Rutina;
}

export function listarRutinas() {
  return solicitar<Rutina[]>('/rutinas', { autenticado: true });
}

export function obtenerMiRutina() {
  return solicitar<Rutina | null>('/rutinas/mi-rutina', { autenticado: true });
}

export function asignarme(rutinaId: string) {
  return solicitar<{ id: string }>('/rutinas/asignarme', {
    metodo: 'POST',
    autenticado: true,
    cuerpo: { rutinaId },
  });
}

export function registrarSesion(datos: { rutinaId: string; duracionMin: number; caloriasEstimadas: number }) {
  return solicitar<SesionEntrenamiento>('/rutinas/sesiones', {
    metodo: 'POST',
    autenticado: true,
    cuerpo: datos,
  });
}

export function obtenerHistorial() {
  return solicitar<SesionEntrenamiento[]>('/rutinas/historial', { autenticado: true });
}

export function listarAlternativas(rutinaEjercicioId: string) {
  return solicitar<Ejercicio[]>(`/rutinas/ejercicios/${rutinaEjercicioId}/alternativas`, { autenticado: true });
}

export function sustituirEjercicio(rutinaEjercicioId: string, ejercicioId: string) {
  return solicitar(`/rutinas/ejercicios/${rutinaEjercicioId}/sustituir`, {
    metodo: 'POST',
    autenticado: true,
    cuerpo: { ejercicioId },
  });
}

export function quitarSustitucion(rutinaEjercicioId: string) {
  return solicitar(`/rutinas/ejercicios/${rutinaEjercicioId}/sustituir`, {
    metodo: 'DELETE',
    autenticado: true,
  });
}
