// app/api/horarios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT - Actualizar un bloque de horario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      diaSemana,
      horaInicio,
      horaFin,
      materia,
      docenteId,
      nivel,
      grado,
      seccion,
      aula,
      anioAcademico,
    } = body;

    const horarioExistente = await prisma.horario.findUnique({
      where: { id },
    });

    if (!horarioExistente) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    const horario = await prisma.horario.update({
      where: { id },
      data: {
        diaSemana: diaSemana || horarioExistente.diaSemana,
        horaInicio: horaInicio || horarioExistente.horaInicio,
        horaFin: horaFin || horarioExistente.horaFin,
        materia: materia || horarioExistente.materia,
        docenteId: docenteId || horarioExistente.docenteId,
        nivel: nivel || horarioExistente.nivel,
        grado: grado || horarioExistente.grado,
        seccion: seccion || horarioExistente.seccion,
        aula: aula !== undefined ? aula : horarioExistente.aula,
        anioAcademico: anioAcademico || horarioExistente.anioAcademico,
      },
      include: {
        docente: {
          include: {
            user: {
              select: {
                nombre: true,
                apellido: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      id: horario.id,
      diaSemana: horario.diaSemana,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      materia: horario.materia,
      docenteId: horario.docenteId,
      docente: `${horario.docente.user.nombre} ${horario.docente.user.apellido || ''}`.trim(),
      nivel: horario.nivel,
      grado: horario.grado,
      seccion: horario.seccion,
      aula: horario.aula || '',
      anioAcademico: horario.anioAcademico,
      createdAt: horario.createdAt,
      updatedAt: horario.updatedAt,
    });
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el horario' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un bloque de horario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const horario = await prisma.horario.findUnique({
      where: { id },
    });

    if (!horario) {
      return NextResponse.json(
        { error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    await prisma.horario.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Horario eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el horario' },
      { status: 500 }
    );
  }
}