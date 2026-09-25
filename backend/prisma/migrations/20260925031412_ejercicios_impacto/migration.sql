-- AlterTable
ALTER TABLE "ejercicios" ADD COLUMN     "esAltoImpacto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiereSaltos" BOOLEAN NOT NULL DEFAULT false;
