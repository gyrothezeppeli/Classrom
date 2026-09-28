/*
  Warnings:

  - Added the required column `fechaNacimiento` to the `Estudiante` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Docente" DROP CONSTRAINT "Docente_userId_fkey";

-- DropForeignKey
ALTER TABLE "Estudiante" DROP CONSTRAINT "Estudiante_userId_fkey";

-- AlterTable
ALTER TABLE "Estudiante" ADD COLUMN     "fechaNacimiento" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Salon" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "docenteIds" TEXT[],
    "estudianteIds" TEXT[],
    "anioAcademico" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Salon_nivel_idx" ON "Salon"("nivel");

-- CreateIndex
CREATE INDEX "Salon_grado_idx" ON "Salon"("grado");

-- CreateIndex
CREATE INDEX "Salon_seccion_idx" ON "Salon"("seccion");

-- CreateIndex
CREATE INDEX "Docente_nivel_idx" ON "Docente"("nivel");

-- CreateIndex
CREATE INDEX "Docente_seccion_idx" ON "Docente"("seccion");

-- CreateIndex
CREATE INDEX "Estudiante_nivel_idx" ON "Estudiante"("nivel");

-- CreateIndex
CREATE INDEX "Estudiante_grado_idx" ON "Estudiante"("grado");

-- CreateIndex
CREATE INDEX "Estudiante_seccion_idx" ON "Estudiante"("seccion");

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Docente" ADD CONSTRAINT "Docente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
