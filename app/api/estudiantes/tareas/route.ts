// app/api/tareas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { asignarAEstudiantes } from '@/lib/asignar';

// ============================================
// GET - Obtener tareas
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const seccion = searchParams.get('seccion');
    const docenteId = searchParams.get('docenteId');
    const estudianteId = searchParams.get('estudianteId');

    const where: any = {};

    if (nivel) where.nivel = nivel;
    if (grado) where.grado = grado;
    if (seccion) where.seccion = seccion;
    if (docenteId) where.docenteId = docenteId;

    const tareas = await prisma.tarea.findMany({
      where,
      include: {
        docente: {
          include: {
            user: {
              select: { nombre: true, apellido: true, email: true }
            }
          }
        },
        salon: true,
        estudiantes: estudianteId ? {
          where: { estudianteId },
          select: {
            visto: true,
            entregado: true,
            fechaVisto: true,
            fechaEntrega: true,
            calificacion: true
          }
        } : undefined
      },
      orderBy: { createdAt: 'desc' }
    });

    const tareasFormateadas = tareas.map((tarea) => ({
      id: tarea.id,
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      fechaEntrega: tarea.fechaEntrega,
      estado: tarea.estado,
      recursos: tarea.recursos,
      objetivos: tarea.objetivos,
      ponderacion: tarea.ponderacion,
      nivel: tarea.nivel,
      grado: tarea.grado,
      seccion: tarea.seccion,
      materia: tarea.materia,
      docente: `${tarea.docente.user.nombre} ${tarea.docente.user.apellido || ''}`.trim(),
      docenteId: tarea.docenteId,
      docenteEmail: tarea.docente.user.email,
      salon: tarea.salon ? {
        id: tarea.salon.id,
        nombre: tarea.salon.nombre,
        nivel: tarea.salon.nivel,
        grado: tarea.salon.grado,
        seccion: tarea.salon.seccion
      } : null,
      visto: tarea.estudiantes && tarea.estudiantes.length > 0 ? tarea.estudiantes[0].visto : false,
      entregado: tarea.estudiantes && tarea.estudiantes.length > 0 ? tarea.estudiantes[0].entregado : false,
      fechaVisto: tarea.estudiantes && tarea.estudiantes.length > 0 ? tarea.estudiantes[0].fechaVisto : null,
      fechaEntregaEstudiante: tarea.estudiantes && tarea.estudiantes.length > 0 ? tarea.estudiantes[0].fechaEntrega : null,
      calificacion: tarea.estudiantes && tarea.estudiantes.length > 0 ? tarea.estudiantes[0].calificacion : null,
      createdAt: tarea.createdAt,
      updatedAt: tarea.updatedAt
    }));

    return NextResponse.json(tareasFormateadas);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    return NextResponse.json(
      { error: 'Error al obtener las tareas' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Crear una nueva tarea
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      titulo,
      descripcion,
      fechaEntrega,
      recursos,
      objetivos,
      ponderacion,
      nivel,
      grado,
      seccion,
      materia,
      docenteId,
      salonId
    } = body;

    if (!titulo || !fechaEntrega || !nivel || !grado || !materia || !docenteId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, fechaEntrega, nivel, grado, materia, docenteId' },
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

    if (salonId) {
      const salon = await prisma.salon.findUnique({ where: { id: salonId } });
      if (!salon) {
        return NextResponse.json({ error: 'Salón no encontrado' }, { status: 404 });
      }
    }

    // ✅ 1. Crear la tarea
    const nuevaTarea = await prisma.tarea.create({
      data: {
        titulo,
        descripcion: descripcion || '',
        fechaEntrega,
        estado: 'pendiente',
        recursos: recursos || '',
        objetivos: objetivos || '',
        ponderacion: ponderacion || '',
        nivel,
        grado,
        seccion: seccion || 'Única',
        materia,
        docenteId,
        salonId: salonId || null
      },
      include: {
        docente: {
          include: {
            user: {
              select: { nombre: true, apellido: true, email: true }
            }
          }
        },
        salon: true
      }
    });

    // ✅ 2. Asignar a estudiantes coincidentes (función unificada)
    const estudiantesAsignados = await asignarAEstudiantes(
      'tarea',
      nuevaTarea.id,
      nuevaTarea.nivel,
      nuevaTarea.grado,
      nuevaTarea.seccion
    );

    console.log(`✅ Tarea "${nuevaTarea.titulo}" creada y asignada a ${estudiantesAsignados} estudiantes`);

    return NextResponse.json({
      id: nuevaTarea.id,
      titulo: nuevaTarea.titulo,
      descripcion: nuevaTarea.descripcion,
      fechaEntrega: nuevaTarea.fechaEntrega,
      estado: nuevaTarea.estado,
      recursos: nuevaTarea.recursos,
      objetivos: nuevaTarea.objetivos,
      ponderacion: nuevaTarea.ponderacion,
      nivel: nuevaTarea.nivel,
      grado: nuevaTarea.grado,
      seccion: nuevaTarea.seccion,
      materia: nuevaTarea.materia,
      docenteId: nuevaTarea.docenteId,
      docente: {
        nombre: nuevaTarea.docente.user.nombre,
        apellido: nuevaTarea.docente.user.apellido,
        email: nuevaTarea.docente.user.email
      },
      salon: nuevaTarea.salon ? {
        id: nuevaTarea.salon.id,
        nombre: nuevaTarea.salon.nombre,
        nivel: nuevaTarea.salon.nivel,
        grado: nuevaTarea.salon.grado,
        seccion: nuevaTarea.salon.seccion
      } : null,
      estudiantesAsignados,
      createdAt: nuevaTarea.createdAt,
      updatedAt: nuevaTarea.updatedAt
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear tarea:', error);
    return NextResponse.json(
      { error: 'Error al crear la tarea' },
      { status: 500 }
    );
  }
}