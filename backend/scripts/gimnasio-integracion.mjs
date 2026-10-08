// Activa o desactiva la integración con AdminPro de un gimnasio.
//
//   node scripts/gimnasio-integracion.mjs estado
//   node scripts/gimnasio-integracion.mjs on
//   node scripts/gimnasio-integracion.mjs off
//
// Con la integración activada ("on"):
//   - el registro libre queda cerrado en ese gimnasio (los socios los da de alta el administrador en AdminPro);
//   - los socios activan su cuenta con el código de invitación ("Activar mi cuenta" en la app).
// Las cuentas que ya existen sin enlazar siguen funcionando. "off" deja todo como antes.
//
// Si hay más de un gimnasio, indica cuál con --codigo=<código del gimnasio>.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const accion = process.argv[2];
const codigoArg = process.argv.find((a) => a.startsWith('--codigo='))?.split('=')[1];

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

try {
  if (!['estado', 'on', 'off'].includes(accion)) {
    throw new Error('Uso: node scripts/gimnasio-integracion.mjs estado | on | off [--codigo=<código del gimnasio>]');
  }
  const gimnasios = await prisma.gimnasio.findMany({
    where: { activo: true, ...(codigoArg ? { codigo: codigoArg } : {}) },
    select: { id: true, nombre: true, codigo: true, adminIntegrado: true },
  });
  if (!gimnasios.length) throw new Error('No encontré ese gimnasio activo.');
  if (accion !== 'estado' && gimnasios.length > 1) {
    throw new Error(`Hay ${gimnasios.length} gimnasios: indica cuál con --codigo=<código>.`);
  }

  if (accion !== 'estado') {
    await prisma.gimnasio.update({ where: { id: gimnasios[0].id }, data: { adminIntegrado: accion === 'on' } });
  }
  const actual = await prisma.gimnasio.findMany({
    where: { id: { in: gimnasios.map((g) => g.id) } },
    select: { nombre: true, codigo: true, adminIntegrado: true },
  });
  for (const g of actual) {
    console.log(`${g.nombre} (código ${g.codigo}): integración con AdminPro ${g.adminIntegrado ? 'ACTIVADA' : 'desactivada'}`);
  }
  if (!process.env.ADMINPRO_URL || !process.env.ADMINPRO_API_KEY) {
    console.log('Aviso: faltan ADMINPRO_URL y/o ADMINPRO_API_KEY en el .env; con eso la activación de cuentas no funcionará.');
  }
} catch (e) {
  console.error('Error:', e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
