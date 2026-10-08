// Fechas de la membresía. El vencimiento llega del servidor como un instante ISO (AdminPro lo guarda con la hora de
// la renovación); tanto él como "hoy" se pasan a la fecha de Ecuador (UTC-5, sin horario de verano). Es la misma
// cuenta que hace el servidor.

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** La fecha de hoy en Ecuador como "AAAA-MM-DD". */
export function fechaEcuadorHoy(ahora: number = Date.now()): string {
  return new Date(ahora - 5 * 3_600_000).toISOString().slice(0, 10);
}

/** Días que faltan hasta el vencimiento: 0 = vence hoy, negativo = ya venció. */
export function diasHastaVencimiento(venceEn: string, ahora: number = Date.now()): number {
  const vence = fechaEcuadorHoy(Date.parse(venceEn));
  return Math.round((Date.parse(`${vence}T00:00:00Z`) - Date.parse(`${fechaEcuadorHoy(ahora)}T00:00:00Z`)) / 86_400_000);
}

/** "2026-11-07T01:53:00.000Z" -> "6 de noviembre de 2026" (fecha en Ecuador). Se arma a mano para no depender de Intl en el teléfono. */
export function fechaLarga(iso: string): string {
  const [anio, mes, dia] = fechaEcuadorHoy(Date.parse(iso)).split('-').map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
}
