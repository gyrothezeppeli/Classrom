// app/api/usuarios/aprobar/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de usuario no proporcionado' },
        { status: 400 }
      );
    }

    // Actualizamos el usuario como aprobado por Control de Estudios
    const usuarioAprobado = await prisma.user.update({
      where: { id },
      data: {
        aprobado: true, // ✅ Aprobado
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario aprobado correctamente',
      user: usuarioAprobado,
    });
  } catch (error) {
    console.error('Error al aprobar usuario:', error);
    return NextResponse.json(
      { error: 'Error al aprobar usuario' },
      { status: 500 }
    );
  }
}