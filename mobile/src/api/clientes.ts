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
}

export interface DatosOnboarding {
  nivelFitness: 'principiante' | 'intermedio' | 'avanzado';
  nivelActividad: number;
  alturaCm: number;
  pesoActualKg: number;
  pesoObjetivoKg: number;
  restriccionFisica: 'ninguna' | 'impacto_bajo' | 'sin_saltos';
  horaRecordatorio?: string;
}

export interface ResultadoOnboarding {
  objetivoCalculado: string;
  rutinaAsignada: { id: string; nombre: string } | null;
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
