// Recomienda las mejores rutinas para un cliente a partir de sus respuestas del onboarding.
// Es una función pura (sin base de datos) para poder probarla bien; RutinasService le pasa las
// plantillas del gimnasio y el perfil del cliente.

import { ejercicioNoRecomendable, NOMBRE_ZONA, type EjercicioParaLesion, type ZonaLesion } from './lesiones.util.js'

export type NivelFitness = 'principiante' | 'intermedio' | 'avanzado'
const NIVELES: NivelFitness[] = ['principiante', 'intermedio', 'avanzado']

export const MIN_EJERCICIOS_TRAS_ADAPTAR = 3

export type PerfilRecomendacion = {
  nivelFitness: string
  /** Lo que el cliente dice querer ("perdida_grasa" | "ganar_musculo" | "tonificar" | "resistencia" | "salud"). */
  objetivoPrincipal?: string | null
  /** Respaldo si no eligió objetivo (clientes anteriores): el que sale de su peso actual y objetivo. */
  objetivoPorPeso: string
  /** Veces por semana que entrenó los últimos 3 meses (0 a 4; 4 = 4 o más). */
  historialEntrenamiento?: number | null
  frecuenciaSemanal?: number | null
  zonasLesion: readonly string[]
  restriccionFisica: string | null
}

export type PlantillaRecomendable = {
  id: string
  nombre: string
  nivel: string
  objetivo: string
  ejercicios: { ejercicio: EjercicioParaLesion }[]
}

export type Recomendacion = {
  rutinaId: string
  nombre: string
  puntaje: number
  motivos: string[]
  /** Cuántos ejercicios de la plantilla se cambiarán o quitarán por las lesiones o limitaciones. */
  ejerciciosAdaptados: number
}

// Objetivos de plantilla que sirven a cada meta, de más a menos adecuado.
const OBJETIVOS_PREFERIDOS: Record<string, string[]> = {
  perdida_grasa: ['perdida_grasa', 'cardio', 'cuerpo_completo'],
  ganar_musculo: ['fuerza', 'tren_superior', 'tren_inferior', 'cuerpo_completo'],
  tonificar: ['cuerpo_completo', 'core', 'tren_superior', 'tren_inferior'],
  resistencia: ['cardio', 'perdida_grasa', 'cuerpo_completo'],
  salud: ['cuerpo_completo', 'cardio', 'core'],
}
const OBJETIVO_DE_PESO: Record<string, string> = {
  perdida_grasa: 'perdida_grasa',
  fuerza: 'ganar_musculo',
  cuerpo_completo: 'salud',
}
const PUNTOS_POR_POSICION = [50, 35, 25, 15]

const ETIQUETA_OBJETIVO: Record<string, string> = {
  perdida_grasa: 'perder grasa',
  ganar_musculo: 'ganar músculo',
  tonificar: 'tonificar',
  resistencia: 'mejorar tu resistencia',
  salud: 'tu salud general',
}

const OBJETIVOS_DIVIDIDOS = ['tren_superior', 'tren_inferior', 'core']

/**
 * Tu nivel real: lo que dices saber, ajustado por lo que de verdad entrenaste. Quien dice ser avanzado
 * pero no entrenó en 3 meses empieza un nivel más abajo; quien se declara principiante pero venía
 * entrenando 3 o más veces por semana sube a intermedio.
 */
export function nivelEfectivo(nivelFitness: string, historial?: number | null): NivelFitness {
  const base = Math.max(0, NIVELES.indexOf(nivelFitness as NivelFitness))
  if (historial == null) return NIVELES[base]
  if (historial === 0) return NIVELES[Math.max(0, base - 1)]
  if (historial >= 3 && base === 0) return NIVELES[1]
  return NIVELES[base]
}

function metaDelCliente(perfil: PerfilRecomendacion): string {
  return perfil.objetivoPrincipal && OBJETIVOS_PREFERIDOS[perfil.objetivoPrincipal]
    ? perfil.objetivoPrincipal
    : (OBJETIVO_DE_PESO[perfil.objetivoPorPeso] ?? 'salud')
}

function puntosDeNivel(nivelRutina: string, nivelCliente: NivelFitness): number {
  const distancia = NIVELES.indexOf(nivelRutina as NivelFitness) - NIVELES.indexOf(nivelCliente)
  if (distancia === 0) return 30
  if (distancia === -1) return 15 // un poco más fácil: segura
  if (distancia === 1) return 5 // un poco más difícil
  return 0
}

function puntosDeFrecuencia(objetivoRutina: string, frecuencia?: number | null): number {
  if (!frecuencia) return 0
  const dividida = OBJETIVOS_DIVIDIDOS.includes(objetivoRutina)
  if (frecuencia <= 2) return objetivoRutina === 'cuerpo_completo' ? 15 : dividida ? -5 : 0
  if (frecuencia === 3) return objetivoRutina === 'cuerpo_completo' ? 8 : 0
  return dividida || objetivoRutina === 'fuerza' ? 10 : 0
}

export function recomendarRutinas(
  perfil: PerfilRecomendacion,
  plantillas: PlantillaRecomendable[],
  cuantas = 3,
): Recomendacion[] {
  const meta = metaDelCliente(perfil)
  const preferidos = OBJETIVOS_PREFERIDOS[meta]
  const nivel = nivelEfectivo(perfil.nivelFitness, perfil.historialEntrenamiento)
  const zonas = perfil.zonasLesion.filter((z) => z in NOMBRE_ZONA) as ZonaLesion[]

  const candidatas = plantillas
    .filter((p) => p.objetivo !== 'calentamiento')
    .map((plantilla) => {
      const adaptados = plantilla.ejercicios.filter((e) =>
        ejercicioNoRecomendable(e.ejercicio, perfil.restriccionFisica, zonas),
      ).length
      if (plantilla.ejercicios.length - adaptados < MIN_EJERCICIOS_TRAS_ADAPTAR) return null

      const posicion = preferidos.indexOf(plantilla.objetivo)
      const ptsObjetivo = posicion >= 0 ? PUNTOS_POR_POSICION[Math.min(posicion, PUNTOS_POR_POSICION.length - 1)] : 0
      const ptsNivel = puntosDeNivel(plantilla.nivel, nivel)
      const ptsFrecuencia = puntosDeFrecuencia(plantilla.objetivo, perfil.frecuenciaSemanal)
      const penalizacion = Math.min(20, adaptados * 4)

      const motivos: string[] = []
      if (ptsObjetivo > 0) motivos.push(`Va con tu objetivo: ${ETIQUETA_OBJETIVO[meta]}`)
      if (ptsNivel === 30) motivos.push(`Pensada para tu nivel (${nivel})`)
      else if (ptsNivel === 15) motivos.push('Un poco más suave que tu nivel, para ganar técnica')
      if (ptsFrecuencia > 0 && perfil.frecuenciaSemanal) {
        motivos.push(`Se adapta a entrenar ${perfil.frecuenciaSemanal} ${perfil.frecuenciaSemanal === 1 ? 'día' : 'días'} por semana`)
      }
      if (adaptados > 0 && zonas.length) {
        motivos.push(`Cuida tu ${zonas.map((z) => NOMBRE_ZONA[z]).join(' y ')}: cambia ${adaptados} ${adaptados === 1 ? 'ejercicio' : 'ejercicios'}`)
      } else if (adaptados > 0) {
        motivos.push(`Cambia ${adaptados} ${adaptados === 1 ? 'ejercicio' : 'ejercicios'} por tus limitaciones`)
      }

      return {
        plantilla,
        rec: {
          rutinaId: plantilla.id,
          nombre: plantilla.nombre,
          puntaje: ptsObjetivo + ptsNivel + ptsFrecuencia - penalizacion,
          motivos: motivos.slice(0, 3),
          ejerciciosAdaptados: adaptados,
        } satisfies Recomendacion,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.rec.puntaje - a.rec.puntaje || a.plantilla.nombre.localeCompare(b.plantilla.nombre))

  // Variedad: la mejor, y luego las siguientes que cumplan con un objetivo distinto si están cerca de ella.
  const elegidas: typeof candidatas = []
  if (candidatas.length) elegidas.push(candidatas[0])
  for (const c of candidatas.slice(1)) {
    if (elegidas.length >= cuantas) break
    const cercana = c.rec.puntaje >= candidatas[0].rec.puntaje - 25
    const nueva = !elegidas.some((e) => e.plantilla.objetivo === c.plantilla.objetivo)
    if (cercana && nueva) elegidas.push(c)
  }
  for (const c of candidatas) {
    if (elegidas.length >= cuantas) break
    if (!elegidas.includes(c)) elegidas.push(c)
  }
  return elegidas.map((c) => c.rec)
}
