-- AlterTable
ALTER TABLE "Salon" ADD COLUMN     "anioAcademico" TEXT NOT NULL DEFAULT '2024-2025';

-- CreateTable
CREATE TABLE "EstudianteSalon" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstudianteSalon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstudianteSalon_estudianteId_idx" ON "EstudianteSalon"("estudianteId");

-- CreateIndex
CREATE INDEX "EstudianteSalon_salonId_idx" ON "EstudianteSalon"("salonId");

-- CreateIndex
CREATE UNIQUE INDEX "EstudianteSalon_estudianteId_salonId_key" ON "EstudianteSalon"("estudianteId", "salonId");

-- AddForeignKey
ALTER TABLE "EstudianteSalon" ADD CONSTRAINT "EstudianteSalon_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstudianteSalon" ADD CONSTRAINT "EstudianteSalon_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
