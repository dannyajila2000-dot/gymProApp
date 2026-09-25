import { guardar, leer, eliminar } from '@/lib/almacenamiento';

const CLAVE_URI = 'musica_entrenamiento_uri';
const CLAVE_NOMBRE = 'musica_entrenamiento_nombre';

export interface PistaMusica {
  uri: string;
  nombre: string;
}

export async function obtenerPistaGuardada(): Promise<PistaMusica | null> {
  const uri = await leer(CLAVE_URI);
  if (!uri) return null;
  const nombre = (await leer(CLAVE_NOMBRE)) ?? 'Pista sin nombre';
  return { uri, nombre };
}

export async function guardarPista(pista: PistaMusica) {
  await guardar(CLAVE_URI, pista.uri);
  await guardar(CLAVE_NOMBRE, pista.nombre);
}

export async function quitarPista() {
  await eliminar(CLAVE_URI);
  await eliminar(CLAVE_NOMBRE);
}
