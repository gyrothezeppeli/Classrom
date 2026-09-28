// app/api/horarios/completo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE - Eliminar TODOS los bloques de un horario (nivel/grado/sección)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const seccion = searchParams.get('seccion');
    const anioAcademico = searchParams.get('anioAcademico') || '2024-2025';

    if (!nivel || !grado || !seccion) {
      return NextResponse.json(
        { error: 'Faltan parámetros: nivel, grado, seccion' },
        { status: 400 }
      );
    }

    const resultado = await prisma.horario.deleteMany({
      where: {
        nivel,
        grado,
        seccion,
        anioAcademico,
      },
    });

    return NextResponse.json({
      success: true,
      deleted: resultado.count,
      message: `Se eliminaron ${resultado.count} bloques del horario`,
    });
  } catch (error) {
    console.error('Error al eliminar horario completo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el horario completo' },
      { status: 500 }
    );
  }
}