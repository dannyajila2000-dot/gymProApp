import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const gimnasio = await prisma.gimnasio.upsert({
    where: { codigo: 'DEMO' },
    update: {},
    create: { nombre: 'Gimnasio Demo', codigo: 'DEMO' },
  })
  console.log('Gimnasio de prueba listo:', gimnasio.codigo, '-', gimnasio.nombre)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
