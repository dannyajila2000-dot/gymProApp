import { solicitar } from './client';

export type CategoriaFeedback = 'muy_dificil' | 'demasiado_facil' | 'errores' | 'sugerencia' | 'otro';

export function enviarFeedback(datos: { categoria: CategoriaFeedback; mensaje?: string }) {
  return solicitar<{ id: string }>('/feedback', {
    metodo: 'POST',
    autenticado: true,
    cuerpo: datos,
  });
}
