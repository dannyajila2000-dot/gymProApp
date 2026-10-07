-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "frecuenciaSemanal" INTEGER,
ADD COLUMN     "historialEntrenamiento" INTEGER,
ADD COLUMN     "horaEntrenamiento" TEXT,
ADD COLUMN     "objetivoPrincipal" TEXT,
ADD COLUMN     "sucursalId" TEXT,
ADD COLUMN     "zonasLesion" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "sucursales" (
    "id" TEXT NOT NULL,
    "gimnasioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sucursales_gimnasioId_idx" ON "sucursales"("gimnasioId");

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_gimnasioId_fkey" FOREIGN KEY ("gimnasioId") REFERENCES "gimnasios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
