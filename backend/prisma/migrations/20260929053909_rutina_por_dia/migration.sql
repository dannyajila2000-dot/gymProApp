-- CreateTable
CREATE TABLE "rutina_por_dia" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "rutinaId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rutina_por_dia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rutina_por_dia_clienteId_diaSemana_key" ON "rutina_por_dia"("clienteId", "diaSemana");

-- AddForeignKey
ALTER TABLE "rutina_por_dia" ADD CONSTRAINT "rutina_por_dia_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutina_por_dia" ADD CONSTRAINT "rutina_por_dia_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "rutinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
