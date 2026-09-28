// app/api/salones/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT - Actualizar salón
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, nivel, grado, seccion, estudianteIds, anioAcademico } = body;

    // ✅ Verificar que el salón existe
    const salonExistente = await prisma.salon.findUnique({
      where: { id },
      include: { estudiantes: true }
    });

    if (!salonExistente) {
      return NextResponse.json(
        { error: 'Salón no encontrado' },
        { status: 404 }
      );
    }

    // ✅ Actualizar salón y estudiantes en transacción
    const salonActualizado = await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos básicos del salón
      await tx.salon.update({
        where: { id },
        data: {
          nombre: nombre || salonExistente.nombre,
          nivel: nivel || salonExistente.nivel,
          grado: grado || salonExistente.grado,
          seccion: seccion || salonExistente.seccion,
          anioAcademico: anioAcademico || salonExistente.anioAcademico
        }
      });

      // 2. Si se pasan estudianteIds, actualizar las relaciones
      //    En tu schema, la relación es directa: Estudiante.salonId
      if (estudianteIds !== undefined) {
        // Desasignar a TODOS los estudiantes que estaban en este salón
        await tx.estudiante.updateMany({
          where: { salonId: id },
          data: { salonId: null }
        });

        // Asignar los nuevos estudiantes al salón
        if (estudianteIds.length > 0) {
          await tx.estudiante.updateMany({
            where: { id: { in: estudianteIds } },
            data: { salonId: id }
          });
        }
      }

      // 3. Obtener el salón actualizado con estudiantes
      const salonConEstudiantes = await tx.salon.findUnique({
        where: { id },
        include: { estudiantes: true }
      });

      return salonConEstudiantes!;
    });

    return NextResponse.json({
      id: salonActualizado.id,
      nombre: salonActualizado.nombre,
      nivel: salonActualizado.nivel,
      grado: salonActualizado.grado,
      seccion: salonActualizado.seccion,
      docenteIds: [],
      // ✅ Ahora es es.id (no es.estudianteId) porque `estudiantes` son objetos Estudiante
      estudianteIds: salonActualizado.estudiantes.map(es => es.id),
      anioAcademico: salonActualizado.anioAcademico,
      createdAt: salonActualizado.createdAt,
      updatedAt: salonActualizado.updatedAt
    });
  } catch (error) {
    console.error('Error al actualizar salón:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el salón', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar salón
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const salon = await prisma.salon.findUnique({
      where: { id }
    });

    if (!salon) {
      return NextResponse.json(
        { error: 'Salón no encontrado' },
        { status: 404 }
      );
    }

    // ✅ Desasignar a los estudiantes antes de eliminar el salón
    //    (el schema tiene onDelete: SetNull, pero lo hacemos explícito por claridad)
    await prisma.estudiante.updateMany({
      where: { salonId: id },
      data: { salonId: null }
    });

    // ✅ Eliminar el salón
    await prisma.salon.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Salón eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar salón:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el salón', details: (error as Error).message },
      { status: 500 }
    );
  }
}