-- AlterTable: nuevos campos de perfil en clientes
ALTER TABLE "clientes"
  ADD COLUMN "fechaNacimiento" TIMESTAMP(3),
  ADD COLUMN "unidadPeso" TEXT NOT NULL DEFAULT 'kg',
  ADD COLUMN "unidadAltura" TEXT NOT NULL DEFAULT 'cm',
  ADD COLUMN "preferenciaEntrenador" TEXT NOT NULL DEFAULT 'animacion';

-- CreateTable: recordatorios
CREATE TABLE "recordatorios" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "diasSemana" INTEGER[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recordatorios_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_clienteId_fkey"
  FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrar el horaRecordatorio existente (si lo hay) a la nueva tabla, con todos los días activos
INSERT INTO "recordatorios" ("id", "clienteId", "hora", "diasSemana", "activo")
SELECT (md5(random()::text || clock_timestamp()::text))::uuid::text, "id", "horaRecordatorio", ARRAY[0,1,2,3,4,5,6], true
FROM "clientes"
WHERE "horaRecordatorio" IS NOT NULL;

-- Ahora sí se puede quitar la columna vieja
ALTER TABLE "clientes" DROP COLUMN "horaRecordatorio";
