/*
  Warnings:

  - A unique constraint covering the columns `[cedulaIdentidad]` on the table `Docente` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Docente" ADD COLUMN     "cedulaIdentidad" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Docente_cedulaIdentidad_key" ON "Docente"("cedulaIdentidad");

-- CreateIndex
CREATE INDEX "Docente_cedulaIdentidad_idx" ON "Docente"("cedulaIdentidad");
