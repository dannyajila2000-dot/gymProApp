-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "horaRecordatorio" TEXT,
ADD COLUMN     "nivelActividad" INTEGER,
ADD COLUMN     "nivelFitness" TEXT,
ADD COLUMN     "onboardingCompletado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pesoObjetivoKg" DOUBLE PRECISION,
ADD COLUMN     "restriccionFisica" TEXT;
