import { solicitar } from './client';

export interface Recordatorio {
  id: string;
  hora: string;
  diasSemana: number[];
  activo: boolean;
}

export function listarRecordatorios() {
  return solicitar<Recordatorio[]>('/recordatorios', { autenticado: true });
}

export function crearRecordatorio(datos: { hora: string; diasSemana: number[] }) {
  return solicitar<Recordatorio>('/recordatorios', {
    metodo: 'POST',
    autenticado: true,
    cuerpo: datos,
  });
}

export function actualizarRecordatorio(
  id: string,
  datos: { hora?: string; diasSemana?: number[]; activo?: boolean },
) {
  return solicitar<Recordatorio>(`/recordatorios/${id}`, {
    metodo: 'PATCH',
    autenticado: true,
    cuerpo: datos,
  });
}

export function eliminarRecordatorio(id: string) {
  return solicitar<{ ok: boolean }>(`/recordatorios/${id}`, {
    metodo: 'DELETE',
    autenticado: true,
  });
}
