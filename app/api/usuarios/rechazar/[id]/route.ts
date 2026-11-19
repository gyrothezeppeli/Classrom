// app/api/usuarios/rechazar/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
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

    // Eliminamos el usuario de la base de datos
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario rechazado y eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al rechazar usuario:', error);
    return NextResponse.json(
      { error: 'Error al rechazar usuario' },
      { status: 500 }
    );
  }
}