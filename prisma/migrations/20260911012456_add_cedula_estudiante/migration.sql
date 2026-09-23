/*
  Warnings:

  - A unique constraint covering the columns `[cedulaIdentidad]` on the table `Estudiante` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Estudiante" ADD COLUMN     "cedulaIdentidad" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_cedulaIdentidad_key" ON "Estudiante"("cedulaIdentidad");

-- CreateIndex
CREATE INDEX "Estudiante_cedulaIdentidad_idx" ON "Estudiante"("cedulaIdentidad");
