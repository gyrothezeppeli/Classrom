// app/api/notas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================
// DELETE: Eliminar una nota por ID
// ============================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // 👈 Promise aquí
) {
  try {
    const { id } = await params;  // 👈 await aquí

    await prisma.nota.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error DELETE /api/notas/[id]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar nota' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT: Actualizar una nota por ID
// ============================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // 👈 Promise aquí
) {
  try {
    const { id } = await params;  // 👈 await aquí
    const body = await req.json();
    const { nota, observacion } = body;

    const notaNum = parseFloat(nota);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 20) {
      return NextResponse.json(
        { error: 'Nota inválida. Debe estar entre 0 y 20' },
        { status: 400 }
      );
    }

    const resultado = await prisma.nota.update({
      where: { id },
      data: {
        nota: notaNum,
        observacion: observacion || '',
      },
    });

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error PUT /api/notas/[id]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar nota' },
      { status: 500 }
    );
  }
}