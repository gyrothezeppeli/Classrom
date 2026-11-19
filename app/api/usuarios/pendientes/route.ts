// app/api/usuarios/pendientes/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const usuariosPendientes = await prisma.user.findMany({
      where: {
        emailVerified: { not: null }, // Ya pasó la validación de correo de Diego
        aprobado: false,              // Está esperando aprobación de Control de Estudios
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        role: true,
        createdAt: true,
        aprobado: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(usuariosPendientes);
  } catch (error) {
    console.error('Error al obtener usuarios pendientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios pendientes' },
      { status: 500 }
    );
  }
}