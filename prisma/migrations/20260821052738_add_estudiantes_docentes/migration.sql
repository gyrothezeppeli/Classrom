-- CreateTable
CREATE TABLE "Estudiante" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "cedulaIdentidad" TEXT NOT NULL,
    "edad" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "numeroTelefonoCelular" TEXT NOT NULL,
    "correoElectronico" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Docente" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "cedulaIdentidad" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "fechaContratacion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Docente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_cedulaIdentidad_key" ON "Estudiante"("cedulaIdentidad");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_userId_key" ON "Estudiante"("userId");

-- CreateIndex
CREATE INDEX "Estudiante_cedulaIdentidad_idx" ON "Estudiante"("cedulaIdentidad");

-- CreateIndex
CREATE UNIQUE INDEX "Docente_cedulaIdentidad_key" ON "Docente"("cedulaIdentidad");

-- CreateIndex
CREATE UNIQUE INDEX "Docente_email_key" ON "Docente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Docente_userId_key" ON "Docente"("userId");

-- CreateIndex
CREATE INDEX "Docente_cedulaIdentidad_idx" ON "Docente"("cedulaIdentidad");

-- CreateIndex
CREATE INDEX "Docente_email_idx" ON "Docente"("email");

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Docente" ADD CONSTRAINT "Docente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
