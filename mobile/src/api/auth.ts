import { solicitar } from './client';

export interface Cliente {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  gimnasioId: string;
  gimnasio: string;
  telefono: string | null;
  alturaCm: number | null;
  fechaNacimiento: string | null;
  unidadPeso: 'kg' | 'lb';
  unidadAltura: 'cm' | 'in';
  restriccionFisica: 'ninguna' | 'impacto_bajo' | 'sin_saltos' | null;
  preferenciaEntrenador: 'animacion' | 'video';
  guiaDeVozActiva: boolean;
  cuentaAtrasSeg: number;
  volumenMusica: number;
  bajarVolumenConVoz: boolean;
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
