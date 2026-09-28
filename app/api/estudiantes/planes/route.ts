// app/api/estudiantes/planes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { coincideNivel, coincideGrado, coincideSeccion } from '@/lib/coincidencias';

// GET - Obtener planes de evaluación para un estudiante
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estudianteId = searchParams.get('estudianteId');

    if (!estudianteId) {
      return NextResponse.json(
        { error: 'ID de estudiante requerido' },
        { status: 400 }
      );
    }

    const estudiante = await prisma.estudiante.findUnique({
      where: { id: estudianteId },
      include: {
        user: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    });

    if (!estudiante) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      );
    }

    // ✅ Traemos todos los planes y filtramos con variantes
    const todosLosPlanes = await prisma.planEvaluacion.findMany({
      include: {
        docente: {
          include: {
            user: {
              select: {
                nombre: true,
                apellido: true
              }
            }
          }
        },
        estudiantes: {
          where: {
            estudianteId: estudianteId
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const planesFiltrados = todosLosPlanes.filter(
      (plan) =>
        coincideNivel(plan.nivel, estudiante.nivel) &&
        coincideGrado(plan.grado, estudiante.grado) &&
        coincideSeccion(plan.seccion, estudiante.seccion)
    );

    const planesFormateados = planesFiltrados.map((plan) => ({
      id: plan.id,
      areaFormacion: plan.titulo || 'Sin título',
      titulo: plan.titulo,
      descripcion: plan.descripcion,
      nivel: plan.nivel,
      grado: plan.grado,
      seccion: plan.seccion,
      secciones: plan.seccion,
      materia: plan.materia,
      docente: `${plan.docente.user.nombre} ${plan.docente.user.apellido || ''}`.trim(),
      docenteId: plan.docenteId,
      filas: plan.filas || [],
      visto: plan.estudiantes.length > 0 ? plan.estudiantes[0].visto : false,
      fechaVisto: plan.estudiantes.length > 0 ? plan.estudiantes[0].fechaVisto : null,
      calificacion: plan.estudiantes.length > 0 ? plan.estudiantes[0].calificacion : null,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString()
    }));

    console.log(`📊 ${planesFormateados.length} planes enviados al estudiante`);

    return NextResponse.json(planesFormateados);
  } catch (error) {
    console.error('Error al obtener planes del estudiante:', error);
    return NextResponse.json(
      { error: 'Error al obtener planes' },
      { status: 500 }
    );
  }
}

// POST - Marcar plan como visto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { estudianteId, planId, planEvaluacionId, visto } = body;

    // ✅ Aceptar tanto planId como planEvaluacionId
    const idPlan = planId || planEvaluacionId;

    if (!estudianteId || !idPlan) {
      return NextResponse.json(
        { error: 'Estudiante ID y Plan ID requeridos' },
        { status: 400 }
      );
    }

    // ✅ Verificar que el estudiante existe
    const estudiante = await prisma.estudiante.findUnique({
      where: { id: estudianteId }
    });

    if (!estudiante) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      );
    }

    // ✅ Verificar que el plan existe
    const plan = await prisma.planEvaluacion.findUnique({
      where: { id: idPlan }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan de evaluación no encontrado' },
        { status: 404 }
      );
    }

    // ✅ Crear o actualizar relación con fechaVisto
    const result = await prisma.estudiantePlanEvaluacion.upsert({
      where: {
        estudianteId_planEvaluacionId: {
          estudianteId,
          planEvaluacionId: idPlan
        }
      },
      update: {
        visto: visto !== undefined ? visto : true,
        fechaVisto: new Date()
      },
      create: {
        estudianteId,
        planEvaluacionId: idPlan,
        visto: visto !== undefined ? visto : true,
        fechaVisto: new Date()
      },
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
        },
        planEvaluacion: true
      }
    });

    return NextResponse.json({
      id: result.id,
      estudianteId: result.estudianteId,
      planEvaluacionId: result.planEvaluacionId,
      visto: result.visto,
      fechaVisto: result.fechaVisto,
      calificacion: result.calificacion,
      estudiante: {
        nombre: result.estudiante.user.nombre,
        apellido: result.estudiante.user.apellido
      },
      plan: {
        titulo: result.planEvaluacion.titulo
      },
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    });
  } catch (error) {
    console.error('Error al actualizar plan:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el plan' },
      { status: 500 }
    );
  }
}