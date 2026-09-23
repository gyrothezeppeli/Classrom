// app/api/planes-evaluacion/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';  // ✅ CORREGIDO

// GET - Obtener un plan específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const plan = await prisma.planEvaluacion.findUnique({
      where: { id },
      include: {
        docente: {
          include: {
            user: {
              select: {
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        },
        estudiantes: {
          include: {
            estudiante: {
              include: {
                user: {
                  select: {
                    nombre: true,
                    apellido: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: plan.id,
      titulo: plan.titulo,
      descripcion: plan.descripcion,
      nivel: plan.nivel,
      grado: plan.grado,
      seccion: plan.seccion,
      materia: plan.materia,
      docente: `${plan.docente.user.nombre} ${plan.docente.user.apellido}`,
      docenteId: plan.docenteId,
      docenteEmail: plan.docente.user.email,
      filas: plan.filas || [], // ✅ INCLUIR FILAS
      estudiantes: plan.estudiantes.map((ep) => ({
        id: ep.estudiante.id,
        nombre: ep.estudiante.user.nombre,
        apellido: ep.estudiante.user.apellido,
        visto: ep.visto,
        fechaVisto: ep.fechaVisto, // ✅ INCLUIR FECHA VISTO
        calificacion: ep.calificacion
      })),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    });
  } catch (error) {
    console.error('Error al obtener plan:', error);
    return NextResponse.json(
      { error: 'Error al obtener el plan' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      titulo,
      descripcion,
      nivel,
      grado,
      seccion,
      materia,
      filas // ✅ RECIBIR FILAS
    } = body;

    console.log('📥 Datos a actualizar:', { id, titulo, filas });

    // ✅ Verificar que el plan existe
    const planExistente = await prisma.planEvaluacion.findUnique({
      where: { id }
    });

    if (!planExistente) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    // ✅ Actualizar el plan CON filas
    const updatedPlan = await prisma.planEvaluacion.update({
      where: { id },
      data: {
        titulo: titulo || planExistente.titulo,
        descripcion: descripcion !== undefined ? descripcion : planExistente.descripcion,
        nivel: nivel || planExistente.nivel,
        grado: grado || planExistente.grado,
        seccion: seccion || planExistente.seccion,
        materia: materia || planExistente.materia,
        filas: filas !== undefined ? filas : planExistente.filas // ✅ ACTUALIZAR FILAS
      },
      include: {
        docente: {
          include: {
            user: {
              select: {
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        }
      }
    });

    console.log('✅ Plan actualizado con filas:', updatedPlan.filas);

    return NextResponse.json({
      id: updatedPlan.id,
      titulo: updatedPlan.titulo,
      descripcion: updatedPlan.descripcion,
      nivel: updatedPlan.nivel,
      grado: updatedPlan.grado,
      seccion: updatedPlan.seccion,
      materia: updatedPlan.materia,
      docente: `${updatedPlan.docente.user.nombre} ${updatedPlan.docente.user.apellido}`,
      docenteId: updatedPlan.docenteId,
      filas: updatedPlan.filas || [], // ✅ INCLUIR FILAS EN RESPUESTA
      createdAt: updatedPlan.createdAt,
      updatedAt: updatedPlan.updatedAt
    });
  } catch (error) {
    console.error('Error al actualizar plan:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el plan' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // ✅ Verificar que el plan existe
    const planExistente = await prisma.planEvaluacion.findUnique({
      where: { id }
    });

    if (!planExistente) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    // ✅ Eliminar relaciones con estudiantes primero
    await prisma.estudiantePlanEvaluacion.deleteMany({
      where: { planEvaluacionId: id }
    });

    // ✅ Eliminar el plan
    await prisma.planEvaluacion.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Plan eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar plan:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el plan' },
      { status: 500 }
    );
  }
}