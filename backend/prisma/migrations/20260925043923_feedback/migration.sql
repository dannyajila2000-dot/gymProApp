-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "mensaje" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
