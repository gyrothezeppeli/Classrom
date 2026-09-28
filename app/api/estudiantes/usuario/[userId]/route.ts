// app/api/estudiantes/usuario/[userId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    const estudiante = await prisma.estudiante.findUnique({
      where: {
        userId: userId
      },
      include: {
        user: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
            telefono: true
          }
        }
      }
    });

    if (!estudiante) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado para este usuario' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: estudiante.id,
      userId: estudiante.userId,
      nombres: estudiante.user.nombre,
      apellidos: estudiante.user.apellido || '',
      correoElectronico: estudiante.user.email,
      telefono: estudiante.user.telefono || '',
      cedulaIdentidad: estudiante.cedulaIdentidad || '', // ✅ CORREGIDO
      nivel: estudiante.nivel,
      grado: estudiante.grado,
      seccion: estudiante.seccion,
      createdAt: estudiante.createdAt,
      updatedAt: estudiante.updatedAt
    });

  } catch (error) {
    console.error('Error al obtener estudiante:', error);
    return NextResponse.json(
      { error: 'Error al obtener los datos del estudiante' },
      { status: 500 }
    );
  }
}