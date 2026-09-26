-- CreateTable
CREATE TABLE "sustituciones_ejercicio" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "rutinaEjercicioId" TEXT NOT NULL,
    "ejercicioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sustituciones_ejercicio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sustituciones_ejercicio_clienteId_rutinaEjercicioId_key" ON "sustituciones_ejercicio"("clienteId", "rutinaEjercicioId");

-- AddForeignKey
ALTER TABLE "sustituciones_ejercicio" ADD CONSTRAINT "sustituciones_ejercicio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sustituciones_ejercicio" ADD CONSTRAINT "sustituciones_ejercicio_rutinaEjercicioId_fkey" FOREIGN KEY ("rutinaEjercicioId") REFERENCES "rutina_ejercicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sustituciones_ejercicio" ADD CONSTRAINT "sustituciones_ejercicio_ejercicioId_fkey" FOREIGN KEY ("ejercicioId") REFERENCES "ejercicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
