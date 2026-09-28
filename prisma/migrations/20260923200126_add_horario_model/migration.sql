-- CreateTable
CREATE TABLE "Horario" (
    "id" TEXT NOT NULL,
    "diaSemana" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "seccion" TEXT NOT NULL DEFAULT 'A',
    "aula" TEXT,
    "anioAcademico" TEXT NOT NULL DEFAULT '2024-2025',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Horario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Horario_docenteId_idx" ON "Horario"("docenteId");

-- CreateIndex
CREATE INDEX "Horario_nivel_grado_seccion_idx" ON "Horario"("nivel", "grado", "seccion");

-- CreateIndex
CREATE INDEX "Horario_diaSemana_idx" ON "Horario"("diaSemana");

-- CreateIndex
CREATE INDEX "Horario_anioAcademico_idx" ON "Horario"("anioAcademico");

-- AddForeignKey
ALTER TABLE "Horario" ADD CONSTRAINT "Horario_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
