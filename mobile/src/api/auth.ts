import { solicitar } from './client';

/** Estado de la membresía de un socio dado de alta en AdminPro (null para cuentas sin enlazar). */
export interface MembresiaCliente {
  estado: 'activo' | 'por_vencer' | 'vencido' | 'sin_membresia';
  plan: string | null;
  venceEn: string | null;
  diasRestantes: number | null;
  duracionDias: number | null;
}

export interface Cliente {
  membresia?: MembresiaCliente | null;
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  gimnasioId: string;
  gimnasio: string;
  gimnasioCodigo: string;
  telefono: string | null;
  alturaCm: number | null;
  pesoActualKg: number | null;
  pesoObjetivoKg: number | null;
  fechaNacimiento: string | null;
  unidadPeso: 'kg' | 'lb';
  unidadAltura: 'cm' | 'in';
  restriccionFisica: 'ninguna' | 'impacto_bajo' | 'sin_saltos' | null;
  preferenciaEntrenador: 'animacion' | 'video';
  guiaDeVozActiva: boolean;
  cuentaAtrasSeg: number;
  volumenMusica: number;
  bajarVolumenConVoz: boolean;
  diasEntrenamientoSemana: number[];
  calentamientoActivo: boolean;
  onboardingCompletado: boolean;
}

export interface RespuestaAuth {
  cliente: Cliente;
  accessToken: string;
  refreshToken: string;
}

export function login(datos: { email: string; password: string; codigoGimnasio: string }) {
  return solicitar<RespuestaAuth>('/auth/login', { metodo: 'POST', cuerpo: datos });
}

export function registro(datos: {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  codigoGimnasio: string;
}) {
  return solicitar<RespuestaAuth>('/auth/registro', { metodo: 'POST', cuerpo: datos });
}

/** Activa la cuenta de un socio que el gimnasio dio de alta en AdminPro. */
export function activarCuenta(datos: { codigoGimnasio: string; email: string; codigo: string; password: string }) {
  return solicitar<RespuestaAuth>('/auth/activar', { metodo: 'POST', cuerpo: datos });
}

/** Vuelve a consultar la membresía en AdminPro (por ejemplo, después de renovar). */
export function actualizarMembresia() {
  return solicitar<Cliente>('/auth/membresia/actualizar', { metodo: 'POST', autenticado: true });
}

export function refrescar(refreshToken: string) {
  return solicitar<{ accessToken: string; refreshToken: string }>('/auth/refrescar', {
    metodo: 'POST',
    cuerpo: { refreshToken },
  });
}

export function cerrarSesion(refreshToken: string) {
  return solicitar<{ ok: boolean }>('/auth/cerrar-sesion', {
    metodo: 'POST',
    cuerpo: { refreshToken },
  });
}

export function obtenerPerfil() {
  return solicitar<Cliente>('/auth/yo', { autenticado: true });
}

export function cambiarPassword(datos: { passwordActual: string; passwordNueva: string }) {
  return solicitar<{ ok: boolean }>('/auth/cambiar-password', {
    metodo: 'POST',
    autenticado: true,
    cuerpo: datos,
  });
}
