/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Docente` table. All the data in the column will be lost.
  - You are about to drop the column `apellido` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Estudiante` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Docente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Estudiante` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Docente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Estudiante` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ESTUDIANTE', 'DOCENTE', 'ADMIN');

-- DropIndex
DROP INDEX "Docente_email_idx";

-- DropIndex
DROP INDEX "Docente_email_key";

-- DropIndex
DROP INDEX "Estudiante_email_idx";

-- DropIndex
DROP INDEX "Estudiante_email_key";

-- AlterTable
ALTER TABLE "Docente" DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "nombre",
DROP COLUMN "password",
DROP COLUMN "telefono",
DROP COLUMN "updatedAt",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Estudiante" DROP COLUMN "apellido",
DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "nombre",
DROP COLUMN "password",
DROP COLUMN "telefono",
DROP COLUMN "updatedAt",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "telefono" TEXT,
    "role" "Role" NOT NULL DEFAULT 'ESTUDIANTE',
    "imagen" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Docente_userId_key" ON "Docente"("userId");

-- CreateIndex
CREATE INDEX "Docente_userId_idx" ON "Docente"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_userId_key" ON "Estudiante"("userId");

-- CreateIndex
CREATE INDEX "Estudiante_userId_idx" ON "Estudiante"("userId");

-- AddForeignKey
ALTER TABLE "Docente" ADD CONSTRAINT "Docente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
