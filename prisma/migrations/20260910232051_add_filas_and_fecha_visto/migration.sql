/*
  Warnings:

  - Added the required column `updatedAt` to the `Docente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Estudiante` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Docente" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Estudiante" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "PlanEvaluacion" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "nivel" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "filas" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanEvaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstudiantePlanEvaluacion" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "planEvaluacionId" TEXT NOT NULL,
    "calificacion" DOUBLE PRECISION,
    "visto" BOOLEAN NOT NULL DEFAULT false,
    "fechaVisto" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstudiantePlanEvaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanEvaluacion_docenteId_idx" ON "PlanEvaluacion"("docenteId");

-- CreateIndex
CREATE INDEX "PlanEvaluacion_nivel_grado_seccion_idx" ON "PlanEvaluacion"("nivel", "grado", "seccion");

-- CreateIndex
CREATE INDEX "EstudiantePlanEvaluacion_estudianteId_idx" ON "EstudiantePlanEvaluacion"("estudianteId");

-- CreateIndex
CREATE INDEX "EstudiantePlanEvaluacion_planEvaluacionId_idx" ON "EstudiantePlanEvaluacion"("planEvaluacionId");

-- CreateIndex
CREATE UNIQUE INDEX "EstudiantePlanEvaluacion_estudianteId_planEvaluacionId_key" ON "EstudiantePlanEvaluacion"("estudianteId", "planEvaluacionId");

-- AddForeignKey
ALTER TABLE "PlanEvaluacion" ADD CONSTRAINT "PlanEvaluacion_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstudiantePlanEvaluacion" ADD CONSTRAINT "EstudiantePlanEvaluacion_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstudiantePlanEvaluacion" ADD CONSTRAINT "EstudiantePlanEvaluacion_planEvaluacionId_fkey" FOREIGN KEY ("planEvaluacionId") REFERENCES "PlanEvaluacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
