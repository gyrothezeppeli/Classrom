// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Hardcodear la URL directamente (reemplaza con tu contraseña real)
const DATABASE_URL = "postgresql://postgres:1234@localhost:5432/classroom";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: DATABASE_URL,
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;