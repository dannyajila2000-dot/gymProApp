const OFFSET_MINUTOS_ECUADOR = -5 * 60; // UTC-5, Ecuador no usa horario de verano

export function fechaEcuadorDeFecha(fecha: Date): string {
  const local = new Date(fecha.getTime() + OFFSET_MINUTOS_ECUADOR * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function fechaDeHoyEcuador(): string {
  return fechaEcuadorDeFecha(new Date());
}
