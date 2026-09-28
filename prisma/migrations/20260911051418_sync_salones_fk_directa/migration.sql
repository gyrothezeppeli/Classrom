/*
  Warnings:

  - You are about to drop the `EstudianteSalon` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nivel,grado,seccion,anioAcademico]` on the table `Salon` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "EstudianteSalon" DROP CONSTRAINT "EstudianteSalon_estudianteId_fkey";

-- DropForeignKey
ALTER TABLE "EstudianteSalon" DROP CONSTRAINT "EstudianteSalon_salonId_fkey";

-- DropIndex
DROP INDEX "Estudiante_grado_idx";

-- DropIndex
DROP INDEX "Estudiante_nivel_idx";

-- DropIndex
DROP INDEX "Estudiante_seccion_idx";

-- DropIndex
DROP INDEX "Salon_nivel_grado_seccion_key";

-- DropIndex
DROP INDEX "Tarea_grado_idx";

-- DropIndex
DROP INDEX "Tarea_nivel_idx";

-- DropIndex
DROP INDEX "Tarea_seccion_idx";

-- AlterTable
ALTER TABLE "Docente" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fechaContratacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nivel" TEXT,
ADD COLUMN     "seccion" TEXT;

-- AlterTable
ALTER TABLE "Estudiante" ADD COLUMN     "salonId" TEXT;

-- DropTable
DROP TABLE "EstudianteSalon";

-- CreateTable
CREATE TABLE "DocenteSalon" (
    "id" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocenteSalon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocenteSalon_docenteId_idx" ON "DocenteSalon"("docenteId");

-- CreateIndex
CREATE INDEX "DocenteSalon_salonId_idx" ON "DocenteSalon"("salonId");

-- CreateIndex
CREATE UNIQUE INDEX "DocenteSalon_docenteId_salonId_key" ON "DocenteSalon"("docenteId", "salonId");

-- CreateIndex
CREATE INDEX "Docente_nivel_seccion_idx" ON "Docente"("nivel", "seccion");

-- CreateIndex
CREATE INDEX "Estudiante_nivel_grado_seccion_idx" ON "Estudiante"("nivel", "grado", "seccion");

-- CreateIndex
CREATE INDEX "Estudiante_salonId_idx" ON "Estudiante"("salonId");

-- CreateIndex
CREATE INDEX "Salon_anioAcademico_idx" ON "Salon"("anioAcademico");

-- CreateIndex
CREATE UNIQUE INDEX "Salon_nivel_grado_seccion_anioAcademico_key" ON "Salon"("nivel", "grado", "seccion", "anioAcademico");

-- CreateIndex
CREATE INDEX "Tarea_nivel_grado_seccion_idx" ON "Tarea"("nivel", "grado", "seccion");

-- CreateIndex
CREATE INDEX "Tarea_salonId_idx" ON "Tarea"("salonId");

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocenteSalon" ADD CONSTRAINT "DocenteSalon_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocenteSalon" ADD CONSTRAINT "DocenteSalon_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
