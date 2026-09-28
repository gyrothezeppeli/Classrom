/*
  Warnings:

  - You are about to drop the column `tipo` on the `Tarea` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Tarea_tipo_idx";

-- AlterTable
ALTER TABLE "Tarea" DROP COLUMN "tipo";

-- CreateTable
CREATE TABLE "Aviso" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "seccion" TEXT NOT NULL DEFAULT 'Única',
    "materia" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aviso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstudianteAviso" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "avisoId" TEXT NOT NULL,
    "visto" BOOLEAN NOT NULL DEFAULT false,
    "fechaVisto" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstudianteAviso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "enlace" TEXT,
    "fecha" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "seccion" TEXT NOT NULL DEFAULT 'Única',
    "materia" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstudianteMaterial" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "visto" BOOLEAN NOT NULL DEFAULT false,
    "fechaVisto" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstudianteMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Aviso_docenteId_idx" ON "Aviso"("docenteId");

-- CreateIndex
CREATE INDEX "Aviso_nivel_grado_seccion_idx" ON "Aviso"("nivel", "grado", "seccion");

-- CreateIndex
CREATE INDEX "Aviso_materia_idx" ON "Aviso"("materia");

-- CreateIndex
CREATE INDEX "Aviso_createdAt_idx" ON "Aviso"("createdAt");

-- CreateIndex
CREATE INDEX "EstudianteAviso_estudianteId_idx" ON "EstudianteAviso"("estudianteId");

-- CreateIndex
CREATE INDEX "EstudianteAviso_avisoId_idx" ON "EstudianteAviso"("avisoId");

-- CreateIndex
CREATE UNIQUE INDEX "EstudianteAviso_estudianteId_avisoId_key" ON "EstudianteAviso"("estudianteId", "avisoId");

-- CreateIndex
CREATE INDEX "Material_docenteId_idx" ON "Material"("docenteId");

-- CreateIndex
CREATE INDEX "Material_nivel_grado_seccion_idx" ON "Material"("nivel", "grado", "seccion");

-- CreateIndex
CREATE INDEX "Material_materia_idx" ON "Material"("materia");

-- CreateIndex
CREATE INDEX "Material_createdAt_idx" ON "Material"("createdAt");

-- CreateIndex
CREATE INDEX "EstudianteMaterial_estudianteId_idx" ON "EstudianteMaterial"("estudianteId");

-- CreateIndex
CREATE INDEX "EstudianteMaterial_materialId_idx" ON "EstudianteMaterial"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "EstudianteMaterial_estudianteId_materialId_key" ON "EstudianteMaterial"("estudianteId", "materialId");

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstudianteAviso" ADD CONSTRAINT "EstudianteAviso_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstudianteAviso" ADD CONSTRAINT "EstudianteAviso_avisoId_fkey" FOREIGN KEY ("avisoId") REFERENCES "Aviso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstudianteMaterial" ADD CONSTRAINT "EstudianteMaterial_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstudianteMaterial" ADD CONSTRAINT "EstudianteMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
