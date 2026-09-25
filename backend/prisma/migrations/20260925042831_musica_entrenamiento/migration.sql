-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "bajarVolumenConVoz" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "volumenMusica" DOUBLE PRECISION NOT NULL DEFAULT 0.5;
