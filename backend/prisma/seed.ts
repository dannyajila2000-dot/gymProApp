import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const EJERCICIOS = [
  { nombre: 'Sentadillas', grupoMuscular: 'Piernas', tipoMedida: 'repeticiones', caloriasPorMinuto: 8 },
  { nombre: 'Flexiones de pecho', grupoMuscular: 'Pecho', tipoMedida: 'repeticiones', caloriasPorMinuto: 7 },
  { nombre: 'Plancha abdominal', grupoMuscular: 'Core', tipoMedida: 'duracion', caloriasPorMinuto: 5 },
  { nombre: 'Zancadas', grupoMuscular: 'Piernas', tipoMedida: 'repeticiones', caloriasPorMinuto: 8 },
  {
    nombre: 'Burpees',
    grupoMuscular: 'Cuerpo completo',
    tipoMedida: 'repeticiones',
    caloriasPorMinuto: 12,
    esAltoImpacto: true,
    requiereSaltos: true,
  },
  { nombre: 'Mountain climbers', grupoMuscular: 'Core', tipoMedida: 'duracion', caloriasPorMinuto: 10 },
  { nombre: 'Remo con mancuerna', grupoMuscular: 'Espalda', tipoMedida: 'repeticiones', caloriasPorMinuto: 7 },
  { nombre: 'Press militar', grupoMuscular: 'Hombros', tipoMedida: 'repeticiones', caloriasPorMinuto: 6 },
  { nombre: 'Puente de glúteo', grupoMuscular: 'Piernas', tipoMedida: 'repeticiones', caloriasPorMinuto: 5 },
  {
    nombre: 'Jumping jacks',
    grupoMuscular: 'Cardio',
    tipoMedida: 'duracion',
    caloriasPorMinuto: 9,
    esAltoImpacto: true,
    requiereSaltos: true,
  },
]

async function main() {
  const gimnasio = await prisma.gimnasio.upsert({
    where: { codigo: 'DEMO' },
    update: {},
    create: { nombre: 'Gimnasio Demo', codigo: 'DEMO' },
  })
  console.log('Gimnasio de prueba listo:', gimnasio.codigo, '-', gimnasio.nombre)

  const ejerciciosExistentes = await prisma.ejercicio.count()
  if (ejerciciosExistentes === 0) {
    await prisma.ejercicio.createMany({ data: EJERCICIOS })
    console.log(`${EJERCICIOS.length} ejercicios de prueba creados`)
  }

  const todosLosEjercicios = await prisma.ejercicio.findMany()
  const porNombre = (nombre: string) => todosLosEjercicios.find((e) => e.nombre === nombre)!

  const rutinasExistentes = await prisma.rutina.count({ where: { gimnasioId: gimnasio.id } })
  if (rutinasExistentes === 0) {
    await prisma.rutina.create({
      data: {
        gimnasioId: gimnasio.id,
        nombre: 'Cuerpo completo - Principiante',
        nivel: 'principiante',
        objetivo: 'cuerpo_completo',
        descripcion: 'Rutina de 20 minutos para activar todo el cuerpo, ideal para empezar.',
        ejercicios: {
          create: [
            { orden: 1, ejercicioId: porNombre('Sentadillas').id, series: 3, repeticiones: 15, descansoSeg: 30 },
            { orden: 2, ejercicioId: porNombre('Flexiones de pecho').id, series: 3, repeticiones: 10, descansoSeg: 30 },
            { orden: 3, ejercicioId: porNombre('Plancha abdominal').id, series: 3, duracionSeg: 30, descansoSeg: 30 },
            { orden: 4, ejercicioId: porNombre('Puente de glúteo').id, series: 3, repeticiones: 15, descansoSeg: 30 },
          ],
        },
      },
    })

    await prisma.rutina.create({
      data: {
        gimnasioId: gimnasio.id,
        nombre: 'Quema grasa - Intermedio',
        nivel: 'intermedio',
        objetivo: 'perdida_grasa',
        descripcion: 'Circuito de alta intensidad de 25 minutos para maximizar la quema de calorías.',
        ejercicios: {
          create: [
            { orden: 1, ejercicioId: porNombre('Jumping jacks').id, series: 3, duracionSeg: 45, descansoSeg: 15 },
            { orden: 2, ejercicioId: porNombre('Burpees').id, series: 3, repeticiones: 12, descansoSeg: 30 },
            { orden: 3, ejercicioId: porNombre('Mountain climbers').id, series: 3, duracionSeg: 40, descansoSeg: 20 },
            { orden: 4, ejercicioId: porNombre('Zancadas').id, series: 3, repeticiones: 12, descansoSeg: 30 },
          ],
        },
      },
    })

    await prisma.rutina.create({
      data: {
        gimnasioId: gimnasio.id,
        nombre: 'Fuerza tren superior - Avanzado',
        nivel: 'avanzado',
        objetivo: 'fuerza',
        descripcion: 'Enfocada en pecho, espalda y hombros para ganar fuerza y definición.',
        ejercicios: {
          create: [
            { orden: 1, ejercicioId: porNombre('Flexiones de pecho').id, series: 4, repeticiones: 20, descansoSeg: 45 },
            { orden: 2, ejercicioId: porNombre('Remo con mancuerna').id, series: 4, repeticiones: 12, descansoSeg: 45 },
            { orden: 3, ejercicioId: porNombre('Press militar').id, series: 4, repeticiones: 10, descansoSeg: 45 },
          ],
        },
      },
    })

    console.log('3 rutinas de prueba creadas')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
