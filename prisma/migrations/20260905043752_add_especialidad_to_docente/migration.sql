-- CreateTable
CREATE TABLE "PlanEvaluacion" (
    "id" TEXT NOT NULL,
    "areaFormacion" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "ano" TEXT NOT NULL,
    "secciones" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "filas" JSONB NOT NULL,
    "salonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanEvaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstudiantePlanEvaluacion" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "planEvaluacionId" TEXT NOT NULL,
    "visto" BOOLEAN NOT NULL DEFAULT false,
    "fechaVisto" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstudiantePlanEvaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanEvaluacion_docenteId_idx" ON "PlanEvaluacion"("docenteId");

-- CreateIndex
CREATE INDEX "PlanEvaluacion_nivel_idx" ON "PlanEvaluacion"("nivel");

-- CreateIndex
CREATE INDEX "PlanEvaluacion_grado_idx" ON "PlanEvaluacion"("grado");

-- CreateIndex
CREATE INDEX "PlanEvaluacion_salonId_idx" ON "PlanEvaluacion"("salonId");

-- CreateIndex
CREATE INDEX "PlanEvaluacion_createdAt_idx" ON "PlanEvaluacion"("createdAt");

-- CreateIndex
CREATE INDEX "EstudiantePlanEvaluacion_estudianteId_idx" ON "EstudiantePlanEvaluacion"("estudianteId");

-- CreateIndex
CREATE INDEX "EstudiantePlanEvaluacion_planEvaluacionId_idx" ON "EstudiantePlanEvaluacion"("planEvaluacionId");

-- CreateIndex
CREATE INDEX "EstudiantePlanEvaluacion_visto_idx" ON "EstudiantePlanEvaluacion"("visto");

-- CreateIndex
CREATE UNIQUE INDEX "EstudiantePlanEvaluacion_estudianteId_planEvaluacionId_key" ON "EstudiantePlanEvaluacion"("estudianteId", "planEvaluacionId");

-- AddForeignKey
ALTER TABLE "PlanEvaluacion" ADD CONSTRAINT "PlanEvaluacion_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanEvaluacion" ADD CONSTRAINT "PlanEvaluacion_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstudiantePlanEvaluacion" ADD CONSTRAINT "EstudiantePlanEvaluacion_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstudiantePlanEvaluacion" ADD CONSTRAINT "EstudiantePlanEvaluacion_planEvaluacionId_fkey" FOREIGN KEY ("planEvaluacionId") REFERENCES "PlanEvaluacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
