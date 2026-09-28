-- AlterTable
ALTER TABLE "Tarea" ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'tarea';

-- CreateIndex
CREATE INDEX "Tarea_tipo_idx" ON "Tarea"("tipo");
