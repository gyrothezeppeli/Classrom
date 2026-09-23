// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Asegura que las variables de entorno estén disponibles
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // Configuración experimental para Turbopack
  experimental: {
    // Para evitar problemas con Prisma en Turbopack
  },
  // Para que Next.js no ignore el .env
  // turbopack: false, // Si el error persiste, descomenta esta línea
};

module.exports = nextConfig;