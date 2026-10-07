import { describe, expect, it } from 'vitest'

import { ejercicioAfectaZona, ejercicioNoRecomendable } from './lesiones.util.js'
import { nivelEfectivo, recomendarRutinas, type PlantillaRecomendable } from './recomendacion.util.js'

const ej = (nombre: string, grupoMuscular = 'Piernas', extra: Partial<{ esAltoImpacto: boolean; requiereSaltos: boolean }> = {}) => ({
  ejercicio: { nombre, grupoMuscular, esAltoImpacto: false, requiereSaltos: false, ...extra },
})
const plantilla = (id: string, nombre: string, nivel: string, objetivo: string, nombres: string[]): PlantillaRecomendable => ({
  id,
  nombre,
  nivel,
  objetivo,
  ejercicios: nombres.map((n) => ej(n)),
})

const SEGUROS = ['Press de banca', 'Remo sentado', 'Curl con barra', 'Abdominales']

describe('nivelEfectivo', () => {
  it('sin historial deja el nivel declarado', () => expect(nivelEfectivo('intermedio')).toBe('intermedio'))
  it('quien no entrenó en 3 meses baja un nivel', () => {
    expect(nivelEfectivo('avanzado', 0)).toBe('intermedio')
    expect(nivelEfectivo('principiante', 0)).toBe('principiante')
  })
  it('un principiante que venía entrenando mucho sube a intermedio', () => {
    expect(nivelEfectivo('principiante', 3)).toBe('intermedio')
    expect(nivelEfectivo('principiante', 1)).toBe('principiante')
  })
})

describe('lesiones', () => {
  it('rodilla evita sentadillas y todo lo que lleve saltos', () => {
    expect(ejercicioAfectaZona(ej('Sentadilla Frontal').ejercicio, 'rodilla')).toBe(true)
    expect(ejercicioAfectaZona(ej('Saltos al Pecho', 'Cardio', { requiereSaltos: true }).ejercicio, 'rodilla')).toBe(true)
    expect(ejercicioAfectaZona(ej('Press de banca', 'Pecho').ejercicio, 'rodilla')).toBe(false)
  })
  it('hombro evita presses y todo el grupo Hombros, y no toca las piernas', () => {
    expect(ejercicioAfectaZona(ej('Press militar', 'Hombros').ejercicio, 'hombro')).toBe(true)
    expect(ejercicioAfectaZona(ej('Elevaciones frontales', 'Hombros').ejercicio, 'hombro')).toBe(true)
    expect(ejercicioAfectaZona(ej('Prensa de piernas').ejercicio, 'hombro')).toBe(false)
  })
  it('ignora tildes y mayúsculas, y una zona desconocida no afecta a nada', () => {
    expect(ejercicioAfectaZona(ej('PESO MUERTO Convencional', 'Espalda').ejercicio, 'espalda_baja')).toBe(true)
    expect(ejercicioAfectaZona(ej('Peso muerto', 'Espalda').ejercicio, 'cabeza')).toBe(false)
  })
  it('junta la restricción de impacto con las zonas', () => {
    const salto = ej('Polichilenas', 'Cardio', { esAltoImpacto: true }).ejercicio
    expect(ejercicioNoRecomendable(salto, 'impacto_bajo', [])).toBe(true)
    expect(ejercicioNoRecomendable(salto, 'ninguna', [])).toBe(false)
  })
})

describe('recomendarRutinas', () => {
  const plantillas = [
    plantilla('quema', 'Quema grasa', 'principiante', 'perdida_grasa', SEGUROS),
    plantilla('musculo', 'Fuerza base', 'principiante', 'fuerza', SEGUROS),
    plantilla('todo', 'Cuerpo completo', 'principiante', 'cuerpo_completo', SEGUROS),
    plantilla('sup', 'Tren superior', 'principiante', 'tren_superior', SEGUROS),
    plantilla('calent', 'Calentamiento', 'principiante', 'calentamiento', SEGUROS),
  ]
  const perfil = { nivelFitness: 'principiante', objetivoPorPeso: 'cuerpo_completo', zonasLesion: [], restriccionFisica: null }

  it('el objetivo elegido manda', () => {
    const r = recomendarRutinas({ ...perfil, objetivoPrincipal: 'perdida_grasa' }, plantillas)
    expect(r[0].rutinaId).toBe('quema')
    expect(r[0].motivos[0]).toContain('perder grasa')
    const m = recomendarRutinas({ ...perfil, objetivoPrincipal: 'ganar_musculo' }, plantillas)
    expect(m[0].rutinaId).toBe('musculo')
  })

  it('devuelve hasta 3 opciones, sin repetir objetivo cuando hay variedad, y nunca el calentamiento', () => {
    const r = recomendarRutinas({ ...perfil, objetivoPrincipal: 'ganar_musculo' }, plantillas)
    expect(r).toHaveLength(3)
    expect(r.map((x) => x.rutinaId)).not.toContain('calent')
  })

  it('con pocos días a la semana prefiere cuerpo completo; con muchos, rutinas divididas', () => {
    const base = { ...perfil, objetivoPrincipal: 'tonificar' }
    expect(recomendarRutinas({ ...base, frecuenciaSemanal: 2 }, plantillas)[0].rutinaId).toBe('todo')
    const lista = [
      plantilla('todo', 'Cuerpo completo', 'principiante', 'cuerpo_completo', SEGUROS),
      plantilla('sup', 'Tren superior', 'principiante', 'tren_superior', SEGUROS),
    ]
    const r = recomendarRutinas({ ...base, objetivoPrincipal: 'ganar_musculo', frecuenciaSemanal: 5 }, lista)
    expect(r[0].rutinaId).toBe('sup')
  })

  it('un nivel que no entrena hace meses recibe la rutina de un nivel más bajo', () => {
    const lista = [
      plantilla('facil', 'Intermedia', 'intermedio', 'cuerpo_completo', SEGUROS),
      plantilla('dificil', 'Avanzada', 'avanzado', 'cuerpo_completo', SEGUROS),
    ]
    const r = recomendarRutinas({ ...perfil, nivelFitness: 'avanzado', historialEntrenamiento: 0, objetivoPrincipal: 'salud' }, lista)
    expect(r[0].rutinaId).toBe('facil')
  })

  it('descarta las rutinas que con las lesiones se quedan casi sin ejercicios, y avisa de las adaptadas', () => {
    const lista = [
      plantilla('piernas', 'Piernas', 'principiante', 'tren_inferior', ['Sentadilla Frontal', 'Prensa de piernas', 'Zancadas', 'Cinta de correr']),
      plantilla('mixta', 'Mixta', 'principiante', 'cuerpo_completo', [...SEGUROS, 'Sentadilla con disco']),
    ]
    const r = recomendarRutinas({ ...perfil, objetivoPrincipal: 'tonificar', zonasLesion: ['rodilla'] }, lista)
    expect(r.map((x) => x.rutinaId)).toEqual(['mixta'])
    expect(r[0].ejerciciosAdaptados).toBe(1)
    expect(r[0].motivos.join(' ')).toContain('rodilla')
  })

  it('sin objetivo elegido usa el que sale del peso (clientes anteriores)', () => {
    const r = recomendarRutinas({ ...perfil, objetivoPorPeso: 'perdida_grasa' }, plantillas)
    expect(r[0].rutinaId).toBe('quema')
  })
})

describe('motivos honestos sobre el nivel', () => {
  it('una rutina de un nivel más bajo no dice que es para tu nivel', () => {
    const perfil = { nivelFitness: 'intermedio', objetivoPorPeso: 'cuerpo_completo', zonasLesion: [], restriccionFisica: null }
    const r = recomendarRutinas(
      { ...perfil, objetivoPrincipal: 'salud' },
      [plantilla('suave', 'Suave', 'principiante', 'cuerpo_completo', SEGUROS)],
    )
    expect(r[0].motivos.join(' ')).not.toContain('Pensada para tu nivel')
    expect(r[0].motivos.join(' ')).toContain('más suave')
  })
})
