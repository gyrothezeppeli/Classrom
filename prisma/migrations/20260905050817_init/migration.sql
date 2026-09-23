/*
  Warnings:

  - You are about to drop the column `activo` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `apellidos` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `cedulaIdentidad` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `fechaContratacion` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `nivel` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `nombres` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `seccion` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `apellidos` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `cedulaIdentidad` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `correoElectronico` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `edad` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `fechaNacimiento` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `nombres` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `numeroTelefonoCelular` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `sexo` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `anioAcademico` on the `Salon` table. All the data in the column will be lost.
  - You are about to drop the column `docenteIds` on the `Salon` table. All the data in the column will be lost.
  - You are about to drop the column `estudianteIds` on the `Salon` table. All the data in the column will be lost.
  - You are about to drop the `EstudiantePlanEvaluacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlanEvaluacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `Estudiante` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nivel,grado,seccion]` on the table `Salon` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nombre` to the `Docente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Estudiante` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `Estudiante` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Docente" DROP CONSTRAINT "Docente_userId_fkey";

-- DropForeignKey
ALTER TABLE "Estudiante" DROP CONSTRAINT "Estudiante_userId_fkey";

-- DropForeignKey
ALTER TABLE "EstudiantePlanEvaluacion" DROP CONSTRAINT "EstudiantePlanEvaluacion_estudianteId_fkey";

-- DropForeignKey
ALTER TABLE "EstudiantePlanEvaluacion" DROP CONSTRAINT "EstudiantePlanEvaluacion_planEvaluacionId_fkey";

-- DropForeignKey
ALTER TABLE "PlanEvaluacion" DROP CONSTRAINT "PlanEvaluacion_docenteId_fkey";

-- DropForeignKey
ALTER TABLE "PlanEvaluacion" DROP CONSTRAINT "PlanEvaluacion_salonId_fkey";

-- DropIndex
DROP INDEX "Docente_cedulaIdentidad_idx";

-- DropIndex
DROP INDEX "Docente_cedulaIdentidad_key";

-- DropIndex
DROP INDEX "Docente_nivel_idx";

-- DropIndex
DROP INDEX "Docente_seccion_idx";

-- DropIndex
DROP INDEX "Docente_userId_key";

-- DropIndex
DROP INDEX "Estudiante_cedulaIdentidad_idx";

-- DropIndex
DROP INDEX "Estudiante_cedulaIdentidad_key";

-- DropIndex
DROP INDEX "Estudiante_userId_key";

-- AlterTable
ALTER TABLE "Docente" DROP COLUMN "activo",
DROP COLUMN "apellidos",
DROP COLUMN "cedulaIdentidad",
DROP COLUMN "fechaContratacion",
DROP COLUMN "nivel",
DROP COLUMN "nombres",
DROP COLUMN "seccion",
DROP COLUMN "userId",
ADD COLUMN     "nombre" TEXT NOT NULL,
ADD COLUMN     "password" TEXT,
ALTER COLUMN "telefono" DROP NOT NULL,
ALTER COLUMN "especialidad" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Estudiante" DROP COLUMN "apellidos",
DROP COLUMN "cedulaIdentidad",
DROP COLUMN "correoElectronico",
DROP COLUMN "edad",
DROP COLUMN "fechaNacimiento",
DROP COLUMN "nombres",
DROP COLUMN "numeroTelefonoCelular",
DROP COLUMN "sexo",
DROP COLUMN "userId",
ADD COLUMN     "apellido" TEXT,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "nombre" TEXT NOT NULL,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "telefono" TEXT;

-- AlterTable
ALTER TABLE "Salon" DROP COLUMN "anioAcademico",
DROP COLUMN "docenteIds",
DROP COLUMN "estudianteIds",
ADD COLUMN     "capacidad" INTEGER;

-- DropTable
DROP TABLE "EstudiantePlanEvaluacion";

-- DropTable
DROP TABLE "PlanEvaluacion";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaEntrega" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "recursos" TEXT,
    "objetivos" TEXT,
    "ponderacion" TEXT,
    "nivel" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "salonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstudianteTarea" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "tareaId" TEXT NOT NULL,
    "visto" BOOLEAN NOT NULL DEFAULT false,
    "entregado" BOOLEAN NOT NULL DEFAULT false,
    "fechaVisto" TIMESTAMP(3),
    "fechaEntrega" TIMESTAMP(3),
    "calificacion" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstudianteTarea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tarea_docenteId_idx" ON "Tarea"("docenteId");

-- CreateIndex
CREATE INDEX "Tarea_nivel_idx" ON "Tarea"("nivel");

-- CreateIndex
CREATE INDEX "Tarea_grado_idx" ON "Tarea"("grado");

-- CreateIndex
CREATE INDEX "Tarea_seccion_idx" ON "Tarea"("seccion");

-- CreateIndex
CREATE INDEX "Tarea_materia_idx" ON "Tarea"("materia");

-- CreateIndex
CREATE INDEX "Tarea_createdAt_idx" ON "Tarea"("createdAt");

-- CreateIndex
CREATE INDEX "EstudianteTarea_estudianteId_idx" ON "EstudianteTarea"("estudianteId");

-- CreateIndex
CREATE INDEX "EstudianteTarea_tareaId_idx" ON "EstudianteTarea"("tareaId");

-- CreateIndex
CREATE UNIQUE INDEX "EstudianteTarea_estudianteId_tareaId_key" ON "EstudianteTarea"("estudianteId", "tareaId");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_email_key" ON "Estudiante"("email");

-- CreateIndex
CREATE INDEX "Estudiante_email_idx" ON "Estudiante"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Salon_nivel_grado_seccion_key" ON "Salon"("nivel", "grado", "seccion");

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstudianteTarea" ADD CONSTRAINT "EstudianteTarea_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstudianteTarea" ADD CONSTRAINT "EstudianteTarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
