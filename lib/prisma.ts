// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// URL fija
const DATABASE_URL = "postgresql://postgres:1234@localhost:5432/classroom";

// Sobrescribir la variable de entorno
process.env.DATABASE_URL = DATABASE_URL;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasourceUrl: DATABASE_URL,
  log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Función para verificar conexión
export async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Conexión a PostgreSQL exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return false;
  }
}

export default prisma;