const OFFSET_MINUTOS_ECUADOR = -5 * 60 // UTC-5, Ecuador no usa horario de verano

export function fechaDeHoyEcuador(): string {
  const local = new Date(Date.now() + OFFSET_MINUTOS_ECUADOR * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export function inicioYFinDelDiaEcuador(fecha: string) {
  const inicio = new Date(`${fecha}T00:00:00.000Z`)
  inicio.setUTCMinutes(inicio.getUTCMinutes() - OFFSET_MINUTOS_ECUADOR)
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000 - 1)
  return { inicio, fin }
}

/** Semana domingo→sábado que contiene `fecha`, en hora local de Ecuador. */
export function inicioYFinDeLaSemanaEcuador(fecha: string) {
  const { inicio: inicioDelDia } = inicioYFinDelDiaEcuador(fecha)
  const diaSemanaLocal = new Date(inicioDelDia.getTime() - OFFSET_MINUTOS_ECUADOR * 60 * 1000).getUTCDay()
  const inicio = new Date(inicioDelDia.getTime() - diaSemanaLocal * 24 * 60 * 60 * 1000)
  const fin = new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
  return { inicio, fin }
}
