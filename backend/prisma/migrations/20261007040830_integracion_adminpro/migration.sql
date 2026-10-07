-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "adminClienteId" TEXT,
ADD COLUMN     "membresiaEstado" TEXT,
ADD COLUMN     "membresiaPlan" TEXT,
ADD COLUMN     "membresiaSincronizadaEn" TIMESTAMP(3),
ADD COLUMN     "membresiaVenceEn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "gimnasios" ADD COLUMN     "adminIntegrado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sucursales" ADD COLUMN     "adminSucursalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "clientes_adminClienteId_key" ON "clientes"("adminClienteId");

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_adminSucursalId_key" ON "sucursales"("adminSucursalId");

