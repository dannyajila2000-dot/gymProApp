import { solicitar } from './client';

export interface MetaNutricional {
  clienteId: string;
  caloriasObjetivo: number;
  proteinaObjetivoG: number | null;
  carbosObjetivoG: number | null;
  grasaObjetivoG: number | null;
  aguaObjetivoMl: number;
}

export interface Comida {
  id: string;
  fecha: string;
  tipo: 'desayuno' | 'almuerzo' | 'cena' | 'snack';
  nombre: string;
  calorias: number;
  proteinaG: number | null;
  carbosG: number | null;
  grasaG: number | null;
}

export interface RegistroAgua {
  id: string;
  fecha: string;
  cantidadMl: number;
}

export function obtenerMeta() {
  return solicitar<MetaNutricional>('/nutricion/meta', { autenticado: true });
}

export function actualizarMeta(datos: Partial<Omit<MetaNutricional, 'clienteId'>>) {
  return solicitar<MetaNutricional>('/nutricion/meta', {
    metodo: 'PUT',
    autenticado: true,
    cuerpo: datos,
  });
}

export function listarComidas(fecha?: string) {
  const query = fecha ? `?fecha=${fecha}` : '';
  return solicitar<Comida[]>(`/nutricion/comidas${query}`, { autenticado: true });
}

export function agregarComida(datos: {
  tipo: string;
  nombre: string;
  calorias: number;
  proteinaG?: number;
  carbosG?: number;
  grasaG?: number;
}) {
  return solicitar<Comida>('/nutricion/comidas', {
    metodo: 'POST',
    autenticado: true,
    cuerpo: datos,
  });
}

export function eliminarComida(id: string) {
  return solicitar<{ count: number }>(`/nutricion/comidas/${id}`, {
    metodo: 'DELETE',
    autenticado: true,
  });
}

export function obtenerAgua(fecha?: string) {
  const query = fecha ? `?fecha=${fecha}` : '';
  return solicitar<{ registros: RegistroAgua[]; totalMl: number }>(`/nutricion/agua${query}`, {
    autenticado: true,
  });
}

export function agregarAgua(cantidadMl: number) {
  return solicitar<RegistroAgua>('/nutricion/agua', {
    metodo: 'POST',
    autenticado: true,
    cuerpo: { cantidadMl },
  });
}
