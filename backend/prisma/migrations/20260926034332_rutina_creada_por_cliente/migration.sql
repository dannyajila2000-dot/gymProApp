-- AlterTable
ALTER TABLE "rutinas" ADD COLUMN     "creadaPorClienteId" TEXT;

-- AddForeignKey
ALTER TABLE "rutinas" ADD CONSTRAINT "rutinas_creadaPorClienteId_fkey" FOREIGN KEY ("creadaPorClienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
