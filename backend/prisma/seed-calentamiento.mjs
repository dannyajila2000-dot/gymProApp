// Agrega la categoría "Estiramientos y Calentamiento": ejercicios de
// estiramiento (con foto) y 6 rutinas cortas con objetivo "calentamiento".
// Es idempotente: omite lo que ya existe por nombre.
//
//   node prisma/seed-calentamiento.mjs            -> solo muestra qué haría
//   node prisma/seed-calentamiento.mjs --aplicar  -> escribe en la base de datos
//
// Fotos: free-exercise-db (dominio público) https://github.com/yuhonas/free-exercise-db
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const aplicar = process.argv.includes('--aplicar')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

const EJERCICIOS = [
  { nombre: "Círculos de brazos", grupoMuscular: "Calentamiento", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Arm_Circles/0.jpg" },
  { nombre: "Círculos de hombros", grupoMuscular: "Calentamiento", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Shoulder_Circles/0.jpg" },
  { nombre: "Círculos de cadera de pie", grupoMuscular: "Calentamiento", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Hip_Circles/0.jpg" },
  { nombre: "Círculos de tobillo", grupoMuscular: "Calentamiento", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Ankle_Circles/0.jpg" },
  { nombre: "Círculos de rodilla", grupoMuscular: "Calentamiento", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Knee_Circles/0.jpg" },
  { nombre: "Gusano (inchworm)", grupoMuscular: "Calentamiento", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Inchworm/0.jpg" },
  { nombre: "Molinos de viento", grupoMuscular: "Calentamiento", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Windmills/0.jpg" },
  { nombre: "El mejor estiramiento del mundo", grupoMuscular: "Calentamiento", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Worlds_Greatest_Stretch/0.jpg" },
  { nombre: "Tocar la punta de los pies de pie", grupoMuscular: "Calentamiento", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Toe_Touches/0.jpg" },
  { nombre: "Apertura dinámica de pecho", grupoMuscular: "Calentamiento", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dynamic_Chest_Stretch/0.jpg" },
  { nombre: "Estiramiento dinámico de espalda", grupoMuscular: "Calentamiento", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dynamic_Back_Stretch/0.jpg" },
  { nombre: "Estiramiento del gato", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cat_Stretch/0.jpg" },
  { nombre: "Postura del niño", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Childs_Pose/0.jpg" },
  { nombre: "Rodillas al pecho", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hug_Knees_To_Chest/0.jpg" },
  { nombre: "Una rodilla al pecho", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One_Knee_To_Chest/0.jpg" },
  { nombre: "Rodilla cruzada sobre el cuerpo", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Knee_Across_The_Body/0.jpg" },
  { nombre: "Flexores de cadera de pie", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Hip_Flexors/0.jpg" },
  { nombre: "Cuádriceps a cuatro apoyos", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/All_Fours_Quad_Stretch/0.jpg" },
  { nombre: "Estiramiento de isquiotibiales", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hamstring_Stretch/0.jpg" },
  { nombre: "Isquiotibiales sentado en el suelo", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Floor_Hamstring_Stretch/0.jpg" },
  { nombre: "Estiramiento de gemelos de pie", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Gastrocnemius_Calf_Stretch/0.jpg" },
  { nombre: "Estiramiento de tríceps", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Stretch/0.jpg" },
  { nombre: "Estiramiento de hombro", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Shoulder_Stretch/0.jpg" },
  { nombre: "Estiramiento lateral del cuello", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Neck_Stretch/0.jpg" },
  { nombre: "Cuello: barbilla al pecho", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chin_To_Chest_Stretch/0.jpg" },
  { nombre: "Estiramiento de columna", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Spinal_Stretch/0.jpg" },
  { nombre: "Estiramiento lateral de pie", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Lateral_Stretch/0.jpg" },
  { nombre: "Estiramiento con brazos arriba", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Overhead_Stretch/0.jpg" },
  { nombre: "Glúteo tumbado", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Glute/0.jpg" },
  { nombre: "Glúteo sentado", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Glute/0.jpg" },
  { nombre: "Ingle y espalda", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Groin_and_Back_Stretch/0.jpg" },
  { nombre: "Estiramiento del corredor", grupoMuscular: "Estiramientos", gifUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Runners_Stretch/0.jpg" },
]

// [nombre del ejercicio, segundos]. Una serie por ejercicio, 10 s de pausa.
const RUTINAS = [
  {
    nombre: 'Calentamiento antes del entrenamiento',
    descripcion: 'Activa articulaciones y músculos en 3 minutos antes de entrenar.',
    ejercicios: [
      ['Círculos de brazos', 30],
      ['Círculos de hombros', 30],
      ['Círculos de cadera de pie', 30],
      ['Gusano (inchworm)', 30],
      ['Tocar la punta de los pies de pie', 30],
    ],
  },
  {
    nombre: 'Calentamiento para empezar con energía',
    descripcion: 'Movimientos dinámicos para despertar todo el cuerpo.',
    ejercicios: [
      ['Círculos de brazos', 30],
      ['Molinos de viento', 30],
      ['Gusano (inchworm)', 30],
      ['El mejor estiramiento del mundo', 40],
      ['Apertura dinámica de pecho', 30],
      ['Estiramiento dinámico de espalda', 30],
      ['Círculos de tobillo', 30],
      ['Círculos de rodilla', 30],
    ],
  },
  {
    nombre: 'Estiramientos de todo el cuerpo',
    descripcion: 'Una pasada completa por los grandes grupos musculares.',
    ejercicios: [
      ['Estiramiento lateral de pie', 30],
      ['Estiramiento de tríceps', 30],
      ['Estiramiento de hombro', 30],
      ['Flexores de cadera de pie', 30],
      ['Estiramiento de isquiotibiales', 30],
      ['Estiramiento de gemelos de pie', 30],
      ['Postura del niño', 30],
      ['Rodillas al pecho', 30],
    ],
  },
  {
    nombre: 'Estiramientos antes de dormir',
    descripcion: 'Suelta la tensión del día con movimientos lentos.',
    ejercicios: [
      ['Postura del niño', 45],
      ['Estiramiento del gato', 40],
      ['Rodillas al pecho', 40],
      ['Una rodilla al pecho', 40],
      ['Rodilla cruzada sobre el cuerpo', 40],
      ['Glúteo tumbado', 40],
      ['Estiramiento de columna', 40],
    ],
  },
  {
    nombre: 'Estiramientos de tren inferior',
    descripcion: 'Cadera, piernas y glúteos, ideales después de entrenar piernas.',
    ejercicios: [
      ['Flexores de cadera de pie', 35],
      ['Cuádriceps a cuatro apoyos', 35],
      ['Isquiotibiales sentado en el suelo', 35],
      ['Estiramiento de gemelos de pie', 35],
      ['Glúteo sentado', 35],
      ['Ingle y espalda', 35],
      ['Estiramiento del corredor', 35],
    ],
  },
  {
    nombre: 'Estiramientos matutinos',
    descripcion: 'Despierta el cuerpo con estiramientos suaves al levantarte.',
    ejercicios: [
      ['Estiramiento con brazos arriba', 30],
      ['Estiramiento lateral de pie', 30],
      ['Estiramiento del gato', 30],
      ['Estiramiento de columna', 30],
      ['Estiramiento lateral del cuello', 25],
      ['Cuello: barbilla al pecho', 25],
      ['Estiramiento de hombro', 30],
      ['Círculos de brazos', 30],
    ],
  },
]

// Validar que cada rutina use ejercicios definidos aquí antes de tocar nada.
const nombresDefinidos = new Set(EJERCICIOS.map((e) => e.nombre))
const faltantes = RUTINAS.flatMap((r) => r.ejercicios.map(([n]) => n)).filter((n) => !nombresDefinidos.has(n))
if (faltantes.length) {
  console.error('Ejercicios usados en rutinas pero no definidos:', [...new Set(faltantes)])
  await prisma.$disconnect()
  process.exit(1)
}

// 1) Ejercicios
const existentes = new Map((await prisma.ejercicio.findMany()).map((e) => [e.nombre, e]))
let ejerciciosNuevos = 0
for (const e of EJERCICIOS) {
  if (existentes.has(e.nombre)) continue
  console.log(`+ ${aplicar ? 'crea' : 'crearía'} ejercicio: ${e.nombre} [${e.grupoMuscular}]`)
  ejerciciosNuevos++
  if (!aplicar) continue
  const creado = await prisma.ejercicio.create({
    data: {
      nombre: e.nombre,
      grupoMuscular: e.grupoMuscular,
      tipoMedida: 'duracion',
      gifUrl: e.gifUrl,
      caloriasPorMinuto: e.grupoMuscular === 'Calentamiento' ? 4 : 3,
    },
  })
  existentes.set(creado.nombre, creado)
}

// 2) Rutinas (en cada gimnasio)
let rutinasNuevas = 0
for (const gimnasio of await prisma.gimnasio.findMany()) {
  for (const r of RUTINAS) {
    const existe = await prisma.rutina.findFirst({
      where: { gimnasioId: gimnasio.id, nombre: r.nombre, creadaPorClienteId: null },
    })
    if (existe) {
      console.log(`= ya existe (${gimnasio.codigo}): ${r.nombre}`)
      continue
    }
    console.log(`+ ${aplicar ? 'crea' : 'crearía'} rutina (${gimnasio.codigo}): ${r.nombre} - ${r.ejercicios.length} ejercicios`)
    rutinasNuevas++
    if (!aplicar) continue
    await prisma.rutina.create({
      data: {
        gimnasioId: gimnasio.id,
        nombre: r.nombre,
        nivel: 'principiante',
        objetivo: 'calentamiento',
        descripcion: r.descripcion,
        ejercicios: {
          create: r.ejercicios.map(([nombre, segundos], indice) => ({
            ejercicioId: existentes.get(nombre).id,
            orden: indice + 1,
            series: 1,
            duracionSeg: segundos,
            descansoSeg: 10,
          })),
        },
      },
    })
  }
}

console.log(
  aplicar
    ? `Listo: ${ejerciciosNuevos} ejercicios y ${rutinasNuevas} rutinas creados.`
    : `Modo de prueba: ${ejerciciosNuevos} ejercicios y ${rutinasNuevas} rutinas por crear. No se escribió nada; usa --aplicar.`,
)
await prisma.$disconnect()
