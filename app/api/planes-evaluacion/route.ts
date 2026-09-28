// app/api/planes-evaluacion/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { asignarAEstudiantes } from '@/lib/asignar';

// GET - Obtener todos los planes de evaluación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const seccion = searchParams.get('seccion');
    const docenteId = searchParams.get('docenteId');

    const where: any = {};

    if (nivel) where.nivel = nivel;
    if (grado) where.grado = grado;
    if (seccion) where.seccion = seccion;
    if (docenteId) where.docenteId = docenteId;

    const planes = await prisma.planEvaluacion.findMany({
      where,
      include: {
        docente: {
          include: {
            user: {
              select: { nombre: true, apellido: true, email: true }
            }
          }
        },
        estudiantes: {
          include: {
            estudiante: {
              include: {
                user: { select: { nombre: true, apellido: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const planesFormateados = planes.map((plan) => ({
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
      filas: plan.filas || [],
      estudiantes: plan.estudiantes.map((ep) => ({
        id: ep.estudiante.id,
        nombre: ep.estudiante.user.nombre,
        apellido: ep.estudiante.user.apellido,
        visto: ep.visto,
        fechaVisto: ep.fechaVisto,
        calificacion: ep.calificacion
      })),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }));

    return NextResponse.json(planesFormateados);
  } catch (error) {
    console.error('Error al obtener planes:', error);
    return NextResponse.json(
      { error: 'Error al obtener los planes' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo plan de evaluación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      titulo,
      descripcion,
      nivel,
      grado,
      seccion,
      materia,
      docenteId,
      filas
    } = body;

    console.log('📥 Datos recibidos:', { titulo, nivel, grado, seccion, materia, docenteId });

    if (!titulo || !nivel || !grado || !seccion || !materia || !docenteId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, nivel, grado, seccion, materia, docenteId' },
        { status: 400 }
      );
    }

    const docente = await prisma.docente.findUnique({
      where: { id: docenteId },
      include: {
        user: {
          select: { nombre: true, apellido: true, email: true }
        }
      }
    });

    if (!docente) {
      return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });
    }

    // ✅ 1. Crear el plan
    const newPlan = await prisma.planEvaluacion.create({
      data: {
        titulo,
        descripcion: descripcion || '',
        nivel,
        grado,
        seccion,
        materia,
        docenteId,
        filas: filas || []
      },
      include: {
        docente: {
          include: {
            user: {
              select: { nombre: true, apellido: true, email: true }
            }
          }
        }
      }
    });

    // ✅ 2. Asignar a estudiantes coincidentes
    const estudiantesAsignados = await asignarAEstudiantes(
      'planEvaluacion',
      newPlan.id,
      newPlan.nivel,
      newPlan.grado,
      newPlan.seccion
    );

    console.log(`✅ Plan "${newPlan.titulo}" creado y asignado a ${estudiantesAsignados} estudiantes`);

    return NextResponse.json({
      id: newPlan.id,
      titulo: newPlan.titulo,
      descripcion: newPlan.descripcion,
      nivel: newPlan.nivel,
      grado: newPlan.grado,
      seccion: newPlan.seccion,
      materia: newPlan.materia,
      docente: `${newPlan.docente.user.nombre} ${newPlan.docente.user.apellido}`,
      docenteId: newPlan.docenteId,
      docenteEmail: newPlan.docente.user.email,
      filas: newPlan.filas || [],
      estudiantesAsignados, // ✅ Devolvemos el número
      createdAt: newPlan.createdAt,
      updatedAt: newPlan.updatedAt
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear plan:', error);
    return NextResponse.json(
      { error: 'Error al crear el plan' },
      { status: 500 }
    );
  }
}