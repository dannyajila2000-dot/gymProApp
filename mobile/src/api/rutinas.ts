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
  clipUrl?: string | null;
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
  creadaPorClienteId: string | null;
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

export function obtenerRutinaParaEntrenar(rutinaId: string) {
  return solicitar<Rutina | null>(`/rutinas/entrenar/${rutinaId}`, { autenticado: true });
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

export interface DiaPlan {
  fecha: string;
  diaSemana: number;
  numeroDia: number;
  esDiaEntrenamiento: boolean;
  completado: boolean;
  progresoPct: number;
  esHoy: boolean;
  rutinaId: string | null;
  rutinaNombre: string | null;
  fijadaPorCliente: boolean;
  duracionMin: number | null;
  caloriasEstimadas: number | null;
}

export interface RutinaFijadaPorDia {
  id: string;
  diaSemana: number;
  rutinaId: string;
  rutina: { id: string; nombre: string };
}

export function obtenerPlanSemana() {
  return solicitar<DiaPlan[]>('/rutinas/plan-semana', { autenticado: true });
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

export function catalogoEjercicios(filtros: { grupoMuscular?: string; busqueda?: string } = {}) {
  const params = new URLSearchParams();
  if (filtros.grupoMuscular) params.set('grupoMuscular', filtros.grupoMuscular);
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda);
  const query = params.toString() ? `?${params.toString()}` : '';
  return solicitar<Ejercicio[]>(`/rutinas/catalogo-ejercicios${query}`, { autenticado: true });
}

export function misRutinasPersonales() {
  return solicitar<Rutina[]>('/rutinas/mias', { autenticado: true });
}

export function crearRutinaPersonal(datos: { nombre: string; nivel?: string; objetivo?: string }) {
  return solicitar<Rutina>('/rutinas/mias', { metodo: 'POST', autenticado: true, cuerpo: datos });
}

export function duplicarComoPersonal(rutinaId: string) {
  return solicitar<Rutina>(`/rutinas/duplicar/${rutinaId}`, { metodo: 'POST', autenticado: true });
}

export function actualizarRutinaPersonal(
  rutinaId: string,
  datos: { nombre?: string; nivel?: string; objetivo?: string },
) {
  return solicitar<Rutina>(`/rutinas/mias/${rutinaId}`, { metodo: 'PATCH', autenticado: true, cuerpo: datos });
}

export function eliminarRutinaPersonal(rutinaId: string) {
  return solicitar(`/rutinas/mias/${rutinaId}`, { metodo: 'DELETE', autenticado: true });
}

export function agregarEjercicioARutina(
  rutinaId: string,
  datos: { ejercicioId: string; series?: number; repeticiones?: number; duracionSeg?: number; descansoSeg?: number },
) {
  return solicitar<RutinaEjercicio>(`/rutinas/mias/${rutinaId}/ejercicios`, {
    metodo: 'POST',
    autenticado: true,
    cuerpo: datos,
  });
}

export function actualizarEjercicioDeRutina(
  rutinaId: string,
  rutinaEjercicioId: string,
  datos: { series?: number; repeticiones?: number | null; duracionSeg?: number | null; descansoSeg?: number },
) {
  return solicitar<RutinaEjercicio>(`/rutinas/mias/${rutinaId}/ejercicios/${rutinaEjercicioId}`, {
    metodo: 'PATCH',
    autenticado: true,
    cuerpo: datos,
  });
}

export function eliminarEjercicioDeRutina(rutinaId: string, rutinaEjercicioId: string) {
  return solicitar(`/rutinas/mias/${rutinaId}/ejercicios/${rutinaEjercicioId}`, {
    metodo: 'DELETE',
    autenticado: true,
  });
}

export function reordenarEjerciciosDeRutina(rutinaId: string, ordenIds: string[]) {
  return solicitar(`/rutinas/mias/${rutinaId}/ejercicios/orden`, {
    metodo: 'POST',
    autenticado: true,
    cuerpo: { ordenIds },
  });
}

export function listarDiasFijados() {
  return solicitar<RutinaFijadaPorDia[]>('/rutinas/dias-fijados', { autenticado: true });
}

export function fijarRutinaEnDia(diaSemana: number, rutinaId: string) {
  return solicitar(`/rutinas/dias-fijados/${diaSemana}`, {
    metodo: 'PUT',
    autenticado: true,
    cuerpo: { rutinaId },
  });
}

export function quitarRutinaDeDia(diaSemana: number) {
  return solicitar(`/rutinas/dias-fijados/${diaSemana}`, {
    metodo: 'DELETE',
    autenticado: true,
  });
}
