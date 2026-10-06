-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nivel" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "docenteId" TEXT NOT NULL,
    "hora" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsistenciaEstudiante" (
    "id" TEXT NOT NULL,
    "asistenciaId" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "asistio" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsistenciaEstudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nota" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "periodo" TEXT NOT NULL DEFAULT '1er Lapso',
    "nota" DOUBLE PRECISION NOT NULL,
    "observacion" TEXT,
    "docenteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_estudianteId_idx" ON "PushSubscription"("estudianteId");

-- CreateIndex
CREATE INDEX "Asistencia_docenteId_idx" ON "Asistencia"("docenteId");

-- CreateIndex
CREATE INDEX "Asistencia_nivel_grado_seccion_idx" ON "Asistencia"("nivel", "grado", "seccion");

-- CreateIndex
CREATE INDEX "Asistencia_fecha_idx" ON "Asistencia"("fecha");

-- CreateIndex
CREATE INDEX "Asistencia_materia_idx" ON "Asistencia"("materia");

-- CreateIndex
CREATE UNIQUE INDEX "Asistencia_nivel_grado_seccion_materia_fecha_key" ON "Asistencia"("nivel", "grado", "seccion", "materia", "fecha");

-- CreateIndex
CREATE INDEX "AsistenciaEstudiante_asistenciaId_idx" ON "AsistenciaEstudiante"("asistenciaId");

-- CreateIndex
CREATE INDEX "AsistenciaEstudiante_estudianteId_idx" ON "AsistenciaEstudiante"("estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "AsistenciaEstudiante_asistenciaId_estudianteId_key" ON "AsistenciaEstudiante"("asistenciaId", "estudianteId");

-- CreateIndex
CREATE INDEX "Nota_estudianteId_idx" ON "Nota"("estudianteId");

-- CreateIndex
CREATE INDEX "Nota_docenteId_idx" ON "Nota"("docenteId");

-- CreateIndex
CREATE INDEX "Nota_nivel_grado_seccion_idx" ON "Nota"("nivel", "grado", "seccion");

-- CreateIndex
CREATE INDEX "Nota_materia_idx" ON "Nota"("materia");

-- CreateIndex
CREATE INDEX "Nota_periodo_idx" ON "Nota"("periodo");

-- CreateIndex
CREATE UNIQUE INDEX "Nota_estudianteId_materia_nivel_grado_seccion_periodo_key" ON "Nota"("estudianteId", "materia", "nivel", "grado", "seccion", "periodo");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsistenciaEstudiante" ADD CONSTRAINT "AsistenciaEstudiante_asistenciaId_fkey" FOREIGN KEY ("asistenciaId") REFERENCES "Asistencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsistenciaEstudiante" ADD CONSTRAINT "AsistenciaEstudiante_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Docente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
