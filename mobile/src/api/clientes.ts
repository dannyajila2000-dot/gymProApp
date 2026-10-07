import { solicitar } from './client';
import type { Cliente } from './auth';

export interface DatosPerfil {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  fechaNacimiento?: string;
  unidadPeso?: 'kg' | 'lb';
  unidadAltura?: 'cm' | 'in';
  restriccionFisica?: 'ninguna' | 'impacto_bajo' | 'sin_saltos';
  preferenciaEntrenador?: 'animacion' | 'video';
  guiaDeVozActiva?: boolean;
  cuentaAtrasSeg?: number;
  volumenMusica?: number;
  bajarVolumenConVoz?: boolean;
  diasEntrenamientoSemana?: number[];
  calentamientoActivo?: boolean;
}

export interface DatosOnboarding {
  nivelFitness: 'principiante' | 'intermedio' | 'avanzado';
  nivelActividad: number;
  alturaCm: number;
  pesoActualKg: number;
  pesoObjetivoKg: number;
  restriccionFisica: 'ninguna' | 'impacto_bajo' | 'sin_saltos';
  horaRecordatorio?: string;
  // Respuestas ampliadas (el servidor las acepta como opcionales).
  objetivoPrincipal?: string;
  historialEntrenamiento?: number;
  frecuenciaSemanal?: number;
  diasEntrenamiento?: number[];
  horaEntrenamiento?: string;
  recordarme?: boolean;
  zonasLesion?: string[];
  sucursalId?: string;
}

export interface RecomendacionRutina {
  rutinaId: string;
  nombre: string;
  puntaje: number;
  motivos: string[];
  ejerciciosAdaptados: number;
}

export interface ResultadoOnboarding {
  objetivoCalculado: string;
  rutinaAsignada: { id: string; nombre: string } | null;
  recomendaciones: RecomendacionRutina[];
}

export interface Sucursal {
  id: string;
  nombre: string;
  direccion: string | null;
}

export function listarSucursales() {
  return solicitar<Sucursal[]>('/clientes/sucursales', { autenticado: true });
}

export function completarOnboarding(datos: DatosOnboarding) {
  return solicitar<ResultadoOnboarding>('/clientes/onboarding', {
    metodo: 'POST',
    autenticado: true,
    cuerpo: datos,
  });
}

export function recalcularRutina() {
  return solicitar<ResultadoOnboarding>('/clientes/recalcular-rutina', {
    metodo: 'POST',
    autenticado: true,
  });
}

export function actualizarPerfil(datos: DatosPerfil) {
  return solicitar<Cliente>('/clientes/perfil', {
    metodo: 'PATCH',
    autenticado: true,
    cuerpo: datos,
  });
}
