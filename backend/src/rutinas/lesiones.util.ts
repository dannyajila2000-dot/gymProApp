// Qué ejercicios cargan una zona lesionada. Es una primera versión basada en el nombre y el grupo del
// ejercicio (y en sus marcas de impacto/saltos); si algún día cada ejercicio trae sus zonas afectadas
// como dato, este archivo es el único que habría que cambiar.

export const ZONAS_LESION = ['cuello', 'hombro', 'codo', 'muneca', 'espalda_baja', 'cadera', 'rodilla', 'tobillo'] as const
export type ZonaLesion = (typeof ZONAS_LESION)[number]

export const NOMBRE_ZONA: Record<ZonaLesion, string> = {
  cuello: 'cuello',
  hombro: 'hombro',
  codo: 'codo',
  muneca: 'muñeca',
  espalda_baja: 'espalda baja',
  cadera: 'cadera',
  rodilla: 'rodilla',
  tobillo: 'tobillo',
}

export type EjercicioParaLesion = {
  nombre: string
  grupoMuscular: string
  esAltoImpacto: boolean
  requiereSaltos: boolean
}

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const REGLAS: Record<ZonaLesion, { grupos?: string[]; impacto?: boolean; nombre: RegExp }> = {
  cuello: { nombre: /encogimiento|cuello|dominadas|peso muerto|press militar|flexiones en pino/ },
  hombro: {
    grupos: ['Hombros'],
    nombre: /press (de banca|inclinado|de pecho|militar|de hombro)|fondos|dominadas|jalon|aperturas|pullover|flexiones|cruce de poleas|press frances/,
  },
  codo: { nombre: /triceps|press frances|fondos|curl|dominadas|agarre cerrado|biceps|flexiones/ },
  muneca: { nombre: /curl|plancha|flexiones|fondos|rollout|press de banca|press militar|dominadas|remo/ },
  espalda_baja: {
    impacto: true,
    nombre: /peso muerto|remo inclinado|remo en "?t"?|remo con barra|hiperextension|extensiones lumbares|buenos dias|sentadilla|rollout|abdominales en v|hollow|elevaciones de piernas/,
  },
  cadera: { nombre: /zancada|puente|prensa de piernas|sentadilla|peso muerto|aduccion|circulos de cadera|polichi|rodillas elevadas/ },
  rodilla: {
    impacto: true,
    nombre: /sentadilla|zancada|prensa de piernas|extension de cuadriceps|curl cuadriceps|polichi|salto|rodillas elevadas|step|cinta/,
  },
  tobillo: { impacto: true, nombre: /gemelos|talon|cinta|salto|zancada|step|polichi|rodillas elevadas|circulos de tobillo/ },
}

export function ejercicioAfectaZona(ejercicio: EjercicioParaLesion, zona: string): boolean {
  const regla = REGLAS[zona as ZonaLesion]
  if (!regla) return false
  if (regla.impacto && (ejercicio.esAltoImpacto || ejercicio.requiereSaltos)) return true
  if (regla.grupos?.includes(ejercicio.grupoMuscular)) return true
  return regla.nombre.test(sinTildes(ejercicio.nombre))
}

/** ¿Debe evitarse este ejercicio con esas limitaciones? Junta la restricción de impacto y las zonas lesionadas. */
export function ejercicioNoRecomendable(
  ejercicio: EjercicioParaLesion,
  restriccionFisica: string | null,
  zonasLesion: readonly string[],
): boolean {
  if (restriccionFisica === 'impacto_bajo' && ejercicio.esAltoImpacto) return true
  if (restriccionFisica === 'sin_saltos' && ejercicio.requiereSaltos) return true
  return zonasLesion.some((zona) => ejercicioAfectaZona(ejercicio, zona))
}
