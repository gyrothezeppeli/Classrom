// app/api/avisos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asignarAEstudiantes } from '@/lib/asignar';

// ============================================
// GET - Obtener avisos
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

    const avisos = await prisma.aviso.findMany({
      where,
      include: {
        docente: {
          include: {
            user: {
              select: { nombre: true, apellido: true, email: true }
            }
          }
        },
        estudiantes: estudianteId ? {
          where: { estudianteId },
          select: {
            visto: true,
            fechaVisto: true
          }
        } : undefined
      },
      orderBy: { createdAt: 'desc' }
    });

    const avisosFormateados = avisos.map((aviso) => ({
      id: aviso.id,
      titulo: aviso.titulo,
      descripcion: aviso.descripcion,
      fecha: aviso.fecha,
      fechaEntrega: aviso.fecha,
      nivel: aviso.nivel,
      grado: aviso.grado,
      seccion: aviso.seccion,
      materia: aviso.materia,
      docente: `${aviso.docente.user.nombre} ${aviso.docente.user.apellido || ''}`.trim(),
      docenteId: aviso.docenteId,
      docenteEmail: aviso.docente.user.email,
      visto: aviso.estudiantes && aviso.estudiantes.length > 0 ? aviso.estudiantes[0].visto : false,
      fechaVisto: aviso.estudiantes && aviso.estudiantes.length > 0 ? aviso.estudiantes[0].fechaVisto : null,
      createdAt: aviso.createdAt,
      updatedAt: aviso.updatedAt
    }));

    return NextResponse.json(avisosFormateados);
  } catch (error) {
    console.error('Error al obtener avisos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los avisos' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Crear un aviso
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      titulo,
      descripcion,
      fecha,
      nivel,
      grado,
      seccion,
      materia,
      docenteId
    } = body;

    if (!titulo || !fecha || !nivel || !grado || !materia || !docenteId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, fecha, nivel, grado, materia, docenteId' },
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

    // ✅ 1. Crear el aviso
    const nuevoAviso = await prisma.aviso.create({
      data: {
        titulo,
        descripcion: descripcion || '',
        fecha,
        nivel,
        grado,
        seccion: seccion || 'Única',
        materia,
        docenteId
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

    // ✅ 2. Asignar a estudiantes coincidentes (función unificada)
    const estudiantesAsignados = await asignarAEstudiantes(
      'aviso',
      nuevoAviso.id,
      nuevoAviso.nivel,
      nuevoAviso.grado,
      nuevoAviso.seccion
    );

    console.log(`✅ Aviso "${nuevoAviso.titulo}" creado y asignado a ${estudiantesAsignados} estudiantes`);

    return NextResponse.json({
      id: nuevoAviso.id,
      titulo: nuevoAviso.titulo,
      descripcion: nuevoAviso.descripcion,
      fecha: nuevoAviso.fecha,
      nivel: nuevoAviso.nivel,
      grado: nuevoAviso.grado,
      seccion: nuevoAviso.seccion,
      materia: nuevoAviso.materia,
      docenteId: nuevoAviso.docenteId,
      docente: `${nuevoAviso.docente.user.nombre} ${nuevoAviso.docente.user.apellido || ''}`.trim(),
      estudiantesAsignados,
      createdAt: nuevoAviso.createdAt,
      updatedAt: nuevoAviso.updatedAt
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear aviso:', error);
    return NextResponse.json(
      { error: 'Error al crear el aviso' },
      { status: 500 }
    );
  }
}