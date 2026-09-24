-- CreateTable
CREATE TABLE "ejercicios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "grupoMuscular" TEXT NOT NULL,
    "tipoMedida" TEXT NOT NULL,
    "descripcion" TEXT,
    "gifUrl" TEXT,
    "caloriasPorMinuto" DOUBLE PRECISION,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ejercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutinas" (
    "id" TEXT NOT NULL,
    "gimnasioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagenUrl" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rutinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutina_ejercicios" (
    "id" TEXT NOT NULL,
    "rutinaId" TEXT NOT NULL,
    "ejercicioId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "series" INTEGER,
    "repeticiones" INTEGER,
    "duracionSeg" INTEGER,
    "descansoSeg" INTEGER,

    CONSTRAINT "rutina_ejercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_rutinas" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "rutinaId" TEXT NOT NULL,
    "asignadaPor" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cliente_rutinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_entrenamiento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "rutinaId" TEXT NOT NULL,
    "completadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duracionMin" INTEGER NOT NULL,
    "caloriasEstimadas" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "sesiones_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_progreso" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pesoKg" DOUBLE PRECISION,
    "grasaCorporalPct" DOUBLE PRECISION,
    "medidas" JSONB,
    "fotoUrl" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_progreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comidas" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "calorias" DOUBLE PRECISION NOT NULL,
    "proteinaG" DOUBLE PRECISION,
    "carbosG" DOUBLE PRECISION,
    "grasaG" DOUBLE PRECISION,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metas_nutricionales" (
    "clienteId" TEXT NOT NULL,
    "caloriasObjetivo" DOUBLE PRECISION NOT NULL,
    "proteinaObjetivoG" DOUBLE PRECISION,
    "carbosObjetivoG" DOUBLE PRECISION,
    "grasaObjetivoG" DOUBLE PRECISION,
    "aguaObjetivoMl" INTEGER NOT NULL DEFAULT 2000,

    CONSTRAINT "metas_nutricionales_pkey" PRIMARY KEY ("clienteId")
);

-- CreateTable
CREATE TABLE "registros_agua" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cantidadMl" INTEGER NOT NULL,

    CONSTRAINT "registros_agua_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "rutinas" ADD CONSTRAINT "rutinas_gimnasioId_fkey" FOREIGN KEY ("gimnasioId") REFERENCES "gimnasios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutina_ejercicios" ADD CONSTRAINT "rutina_ejercicios_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "rutinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutina_ejercicios" ADD CONSTRAINT "rutina_ejercicios_ejercicioId_fkey" FOREIGN KEY ("ejercicioId") REFERENCES "ejercicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_rutinas" ADD CONSTRAINT "cliente_rutinas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_rutinas" ADD CONSTRAINT "cliente_rutinas_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "rutinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_entrenamiento" ADD CONSTRAINT "sesiones_entrenamiento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_entrenamiento" ADD CONSTRAINT "sesiones_entrenamiento_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "rutinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_progreso" ADD CONSTRAINT "registros_progreso_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comidas" ADD CONSTRAINT "comidas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas_nutricionales" ADD CONSTRAINT "metas_nutricionales_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_agua" ADD CONSTRAINT "registros_agua_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
