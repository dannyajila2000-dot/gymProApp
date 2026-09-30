// Amplía el catálogo con rutinas de ejemplo (plantillas del gimnasio) para que
// las secciones de Descubre tengan contenido. Es idempotente: si ya existe una
// plantilla con el mismo nombre en ese gimnasio, la omite.
//
//   node prisma/seed-rutinas-extra.mjs            -> solo muestra qué haría
//   node prisma/seed-rutinas-extra.mjs --aplicar  -> escribe en la base de datos
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const aplicar = process.argv.includes('--aplicar')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

// Ejercicios por nombre exacto del catálogo: [nombre, series, repeticiones o segundos, descansoSeg]
const RUTINAS = [
  {
    nombre: 'Quema de grasa HIIT',
    nivel: 'intermedio',
    objetivo: 'perdida_grasa',
    descripcion: 'Intervalos intensos para elevar el pulso y quemar calorías en poco tiempo.',
    ejercicios: [
      ['Saltos al Pecho', 3, 12, 30],
      ['Rodillas elevadas', 3, 30, 30],
      ['Step Jack', 3, 30, 30],
      ['Polichilenas', 3, 30, 30],
      ['Abdominales rusas', 3, 20, 30],
      ['Plancha de antebrazo', 3, 30, 30],
    ],
  },
  {
    nombre: 'Quema total sin impacto',
    nivel: 'principiante',
    objetivo: 'perdida_grasa',
    descripcion: 'Quema calorías cuidando las articulaciones, sin saltos.',
    ejercicios: [
      ['Sentadilla con disco', 3, 12, 45],
      ['Puente de glúteos', 3, 15, 45],
      ['Zancadas Caminando con Mancuernas', 3, 10, 45],
      ['Abdominales', 3, 15, 45],
      ['Plancha de antebrazo', 3, 25, 45],
    ],
  },
  {
    nombre: 'Cardio exprés',
    nivel: 'principiante',
    objetivo: 'cardio',
    descripcion: 'Una sesión corta de cardio para activarte cuando tienes poco tiempo.',
    ejercicios: [
      ['Cinta de correr', 1, 300, 30],
      ['Rodillas elevadas', 3, 30, 30],
      ['Polichilenas', 3, 30, 30],
      ['Cardio en bicicleta estática', 1, 300, 30],
    ],
  },
  {
    nombre: 'Cardio intenso',
    nivel: 'avanzado',
    objetivo: 'cardio',
    descripcion: 'Cardio exigente para mejorar tu resistencia.',
    ejercicios: [
      ['Cinta de correr', 1, 600, 30],
      ['Saltos al Pecho', 4, 12, 30],
      ['Step Jack', 4, 40, 30],
      ['Rodillas elevadas', 4, 40, 30],
      ['flexiones en TRX', 3, 12, 45],
    ],
  },
  {
    nombre: 'Fuerza base en máquinas',
    nivel: 'principiante',
    objetivo: 'fuerza',
    descripcion: 'Trabaja pecho, espalda y hombros con máquinas guiadas, ideal para empezar.',
    ejercicios: [
      ['Press de Pecho en Máquina', 3, 12, 60],
      ['Remo sentado', 3, 12, 60],
      ['Press de hombro con maquina', 3, 12, 60],
      ['Jalón al Pecho con Agarre Cerrado', 3, 12, 60],
    ],
  },
  {
    nombre: 'Fuerza y tono',
    nivel: 'intermedio',
    objetivo: 'fuerza',
    descripcion: 'Rutina de cuerpo completo con mancuernas para ganar fuerza y definir.',
    ejercicios: [
      ['Press de banca con mancuernas', 4, 10, 60],
      ['Remo con mancuernas', 4, 10, 60],
      ['Press Militar mancuerna', 3, 10, 60],
      ['Curl de bíceps con mancuerna', 3, 12, 45],
      ['Extensión de triceps', 3, 12, 45],
      ['Sentadilla Frontal', 4, 10, 75],
    ],
  },
  {
    nombre: 'Fuerza máxima',
    nivel: 'avanzado',
    objetivo: 'fuerza',
    descripcion: 'Levantamientos básicos con barra para ganar fuerza de verdad.',
    ejercicios: [
      ['Press de Banca', 5, 5, 120],
      ['Peso Muerto Convencional', 5, 5, 150],
      ['Dominadas', 4, 8, 90],
      ['Press militar', 4, 6, 90],
      ['Remo Inclinado con Barra (agarre prono)', 4, 8, 90],
    ],
  },
  {
    nombre: 'Tren superior inicial',
    nivel: 'principiante',
    objetivo: 'tren_superior',
    descripcion: 'Primeros pasos para pecho, espalda, hombros y brazos.',
    ejercicios: [
      ['Press de Pecho en Máquina', 3, 12, 60],
      ['Remo sentado', 3, 12, 60],
      ['Elevación lateral con mancuernas', 3, 12, 45],
      ['Curl de bíceps con mancuerna', 3, 12, 45],
      ['Fondos entre Bancos', 3, 10, 45],
    ],
  },
  {
    nombre: 'Pecho y tríceps',
    nivel: 'intermedio',
    objetivo: 'tren_superior',
    descripcion: 'Volumen para pecho y tríceps en una sola sesión.',
    ejercicios: [
      ['Press de banca inclinado', 4, 10, 75],
      ['Aperturas con Mancuernas', 3, 12, 60],
      ['Fondos en Paralelas', 3, 10, 60],
      ['Press Francés con Barra SZ', 3, 12, 60],
      ['Aperturas en polea', 3, 15, 45],
    ],
  },
  {
    nombre: 'Espalda y bíceps',
    nivel: 'intermedio',
    objetivo: 'tren_superior',
    descripcion: 'Jalones, remos y curl para una espalda fuerte y brazos definidos.',
    ejercicios: [
      ['Dominadas', 4, 8, 75],
      ['Remo en "T"', 4, 10, 75],
      ['Jalón Alto Inclinado con Mancuernas', 3, 12, 60],
      ['Curl con barra', 3, 12, 60],
      ['Curl Martillo', 3, 12, 45],
    ],
  },
  {
    nombre: 'Piernas y glúteos',
    nivel: 'principiante',
    objetivo: 'tren_inferior',
    descripcion: 'Fortalece piernas y glúteos con movimientos seguros.',
    ejercicios: [
      ['Sentadilla con disco', 3, 12, 60],
      ['Prensa de piernas', 3, 12, 60],
      ['Puente de glúteos', 3, 15, 45],
      ['Curl femoral sentado', 3, 12, 45],
      ['Elevación de talón de pie', 3, 15, 45],
    ],
  },
  {
    nombre: 'Piernas potentes',
    nivel: 'avanzado',
    objetivo: 'tren_inferior',
    descripcion: 'Sesión pesada de tren inferior para ganar potencia.',
    ejercicios: [
      ['Sentadilla Frontal', 5, 6, 120],
      ['Peso muerto en rack', 4, 6, 120],
      ['Zancadas Caminando con Mancuernas', 4, 10, 75],
      ['Prensa de piernas cerrada', 4, 10, 75],
      ['Curl de piernas (tumbado)', 3, 12, 60],
      ['Elevación de gemelos sentado con mancuerna', 4, 15, 45],
    ],
  },
  {
    nombre: 'Abdomen plano',
    nivel: 'principiante',
    objetivo: 'core',
    descripcion: 'Rutina corta para activar y fortalecer el abdomen.',
    ejercicios: [
      ['Abdominales', 3, 15, 45],
      ['Elevaciones de piernas tumbado', 3, 12, 45],
      ['Plancha de antebrazo', 3, 25, 45],
      ['Abdominales rusas', 3, 16, 45],
    ],
  },
  {
    nombre: 'Core de acero',
    nivel: 'avanzado',
    objetivo: 'core',
    descripcion: 'Trabajo de core exigente con isométricos y barra.',
    ejercicios: [
      ['Hollow hold', 3, 30, 45],
      ['Elevaciones de Piernas en Barra', 4, 10, 60],
      ['Rollout Abdominal con Barra', 3, 10, 60],
      ['Sostenimiento Lateral Isométrico', 3, 30, 45],
      ['Abdominales en V con Balón Medicinal', 3, 12, 45],
    ],
  },
  {
    nombre: 'Cuerpo completo - Intermedio',
    nivel: 'intermedio',
    objetivo: 'cuerpo_completo',
    descripcion: 'Un poco de todo: piernas, empuje, tirón y core en una sola sesión.',
    ejercicios: [
      ['Sentadilla con disco', 3, 12, 60],
      ['Press de banca con mancuernas', 3, 10, 60],
      ['Remo con mancuernas', 3, 10, 60],
      ['Zancadas Caminando con Mancuernas', 3, 10, 60],
      ['Plancha de antebrazo', 3, 35, 45],
    ],
  },
  {
    nombre: 'Cuerpo completo - Avanzado',
    nivel: 'avanzado',
    objetivo: 'cuerpo_completo',
    descripcion: 'Sesión completa y exigente para quien ya entrena con constancia.',
    ejercicios: [
      ['Sentadilla Frontal', 4, 8, 90],
      ['Press de Banca', 4, 8, 90],
      ['Dominadas', 4, 8, 90],
      ['Peso Muerto Convencional', 3, 6, 120],
      ['Press militar', 3, 8, 90],
      ['Rollout Abdominal con Barra', 3, 10, 60],
    ],
  },
]

const catalogo = await prisma.ejercicio.findMany()
const porNombre = new Map(catalogo.map((e) => [e.nombre, e]))

// Validar que todos los ejercicios existan antes de tocar nada.
const faltantes = RUTINAS.flatMap((r) => r.ejercicios.map(([n]) => n)).filter((n) => !porNombre.has(n))
if (faltantes.length) {
  console.error('Ejercicios que no existen en el catálogo:', [...new Set(faltantes)])
  await prisma.$disconnect()
  process.exit(1)
}

const gimnasios = await prisma.gimnasio.findMany()
let creadas = 0
for (const gimnasio of gimnasios) {
  for (const r of RUTINAS) {
    const existe = await prisma.rutina.findFirst({
      where: { gimnasioId: gimnasio.id, nombre: r.nombre, creadaPorClienteId: null },
    })
    if (existe) {
      console.log(`= ya existe (${gimnasio.codigo}): ${r.nombre}`)
      continue
    }
    console.log(`+ ${aplicar ? 'crea' : 'crearía'} (${gimnasio.codigo}): ${r.nombre} [${r.nivel}/${r.objetivo}] ${r.ejercicios.length} ejercicios`)
    if (!aplicar) continue

    await prisma.rutina.create({
      data: {
        gimnasioId: gimnasio.id,
        nombre: r.nombre,
        nivel: r.nivel,
        objetivo: r.objetivo,
        descripcion: r.descripcion,
        ejercicios: {
          create: r.ejercicios.map(([nombre, series, cantidad, descansoSeg], indice) => {
            const ejercicio = porNombre.get(nombre)
            const esDuracion = ejercicio.tipoMedida === 'duracion'
            return {
              ejercicioId: ejercicio.id,
              orden: indice + 1,
              series,
              repeticiones: esDuracion ? null : cantidad,
              duracionSeg: esDuracion ? cantidad : null,
              descansoSeg,
            }
          }),
        },
      },
    })
    creadas++
  }
}
console.log(aplicar ? `Listo: ${creadas} rutinas creadas.` : 'Modo de prueba: no se escribió nada. Usa --aplicar para crearlas.')
await prisma.$disconnect()
