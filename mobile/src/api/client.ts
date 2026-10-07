import type { MembresiaCliente } from './auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

let accessTokenActual: string | null = null;

export function establecerAccessToken(token: string | null) {
  accessTokenActual = token;
}

export class ErrorApi extends Error {
  constructor(
    public status: number,
    message: string,
    public datos: { codigo?: string; membresia?: MembresiaCliente } | null = null,
  ) {
    super(message);
  }
}

// La app avisa a la sesión cuando el servidor dice que la membresía venció (403 MEMBRESIA_VENCIDA), para que
// cambie a la pantalla de renovación aunque el cliente tuviera la app abierta.
let alMembresiaVencida: ((membresia: MembresiaCliente) => void) | null = null;

export function establecerManejadorMembresiaVencida(manejador: ((membresia: MembresiaCliente) => void) | null) {
  alMembresiaVencida = manejador;
}

export async function solicitar<T>(
  ruta: string,
  opciones: { metodo?: string; cuerpo?: unknown; autenticado?: boolean } = {},
): Promise<T> {
  const { metodo = 'GET', cuerpo, autenticado = false } = opciones;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (autenticado && accessTokenActual) {
    headers.Authorization = `Bearer ${accessTokenActual}`;
  }

  const respuesta = await fetch(`${BASE_URL}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : null;

  if (!respuesta.ok) {
    const mensaje = datos?.message ?? 'Ocurrió un error inesperado';
    if (respuesta.status === 403 && datos?.codigo === 'MEMBRESIA_VENCIDA' && datos.membresia) {
      alMembresiaVencida?.(datos.membresia);
    }
    throw new ErrorApi(respuesta.status, Array.isArray(mensaje) ? mensaje[0] : mensaje, datos);
  }

  return datos as T;
}
