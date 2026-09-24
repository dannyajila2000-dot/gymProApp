import { solicitar } from './client';

export interface Cliente {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  gimnasioId: string;
  gimnasio: string;
  alturaCm: number | null;
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
