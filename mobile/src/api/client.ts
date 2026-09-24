const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

let accessTokenActual: string | null = null;

export function establecerAccessToken(token: string | null) {
  accessTokenActual = token;
}

export class ErrorApi extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
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
    throw new ErrorApi(respuesta.status, Array.isArray(mensaje) ? mensaje[0] : mensaje);
  }

  return datos as T;
}
