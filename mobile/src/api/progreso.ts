import { solicitar } from './client';

export interface RegistroProgreso {
  id: string;
  fecha: string;
  pesoKg: number | null;
  grasaCorporalPct: number | null;
  medidas: Record<string, number> | null;
  fotoUrl: string | null;
}

export function listarProgreso() {
  return solicitar<RegistroProgreso[]>('/progreso', { autenticado: true });
}

export function registrarProgreso(datos: {
  pesoKg?: number;
  grasaCorporalPct?: number;
  medidas?: Record<string, number>;
}) {
  return solicitar<RegistroProgreso>('/progreso', {
    metodo: 'POST',
    autenticado: true,
    cuerpo: datos,
  });
}

export function actualizarAltura(alturaCm: number) {
  return solicitar<{ alturaCm: number }>('/progreso/altura', {
    metodo: 'PUT',
    autenticado: true,
    cuerpo: { alturaCm },
  });
}
