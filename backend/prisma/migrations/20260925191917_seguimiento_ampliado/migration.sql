-- AlterTable
ALTER TABLE "metas_nutricionales" ADD COLUMN     "aguaAlarmaActiva" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aguaAlarmaCadaHoras" INTEGER,
ADD COLUMN     "aguaVentanaFin" TEXT,
ADD COLUMN     "aguaVentanaInicio" TEXT;

-- CreateTable
CREATE TABLE "metas_seguimiento" (
    "clienteId" TEXT NOT NULL,
    "caloriasQuemarObjetivo" INTEGER NOT NULL DEFAULT 400,
    "duracionObjetivoMin" INTEGER NOT NULL DEFAULT 30,
    "pasosObjetivo" INTEGER NOT NULL DEFAULT 8000,
    "pasosActivo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "metas_seguimiento_pkey" PRIMARY KEY ("clienteId")
);

-- CreateTable
CREATE TABLE "registros_pasos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "registros_pasos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades_libres" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "duracionMin" INTEGER NOT NULL,
    "distanciaM" DOUBLE PRECISION,
    "caloriasEstimadas" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actividades_libres_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "metas_seguimiento" ADD CONSTRAINT "metas_seguimiento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_pasos" ADD CONSTRAINT "registros_pasos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades_libres" ADD CONSTRAINT "actividades_libres_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
