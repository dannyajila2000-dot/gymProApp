-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "cuentaAtrasSeg" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "guiaDeVozActiva" BOOLEAN NOT NULL DEFAULT true;
