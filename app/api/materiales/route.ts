// app/api/materiales/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asignarAEstudiantes } from '@/lib/asignar';

// ============================================
// GET - Obtener materiales
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

    const materiales = await prisma.material.findMany({
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

    const materialesFormateados = materiales.map((material) => ({
      id: material.id,
      titulo: material.titulo,
      descripcion: material.descripcion,
      enlace: material.enlace,
      fecha: material.fecha,
      nivel: material.nivel,
      grado: material.grado,
      seccion: material.seccion,
      materia: material.materia,
      docente: `${material.docente.user.nombre} ${material.docente.user.apellido || ''}`.trim(),
      docenteId: material.docenteId,
      docenteEmail: material.docente.user.email,
      visto: material.estudiantes && material.estudiantes.length > 0 ? material.estudiantes[0].visto : false,
      fechaVisto: material.estudiantes && material.estudiantes.length > 0 ? material.estudiantes[0].fechaVisto : null,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt
    }));

    return NextResponse.json(materialesFormateados);
  } catch (error) {
    console.error('Error al obtener materiales:', error);
    return NextResponse.json(
      { error: 'Error al obtener los materiales' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Crear un material
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      titulo,
      descripcion,
      enlace,
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

    // ✅ 1. Crear el material
    const nuevoMaterial = await prisma.material.create({
      data: {
        titulo,
        descripcion: descripcion || '',
        enlace: enlace || '',
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
      'material',
      nuevoMaterial.id,
      nuevoMaterial.nivel,
      nuevoMaterial.grado,
      nuevoMaterial.seccion
    );

    console.log(`✅ Material "${nuevoMaterial.titulo}" creado y asignado a ${estudiantesAsignados} estudiantes`);

    return NextResponse.json({
      id: nuevoMaterial.id,
      titulo: nuevoMaterial.titulo,
      descripcion: nuevoMaterial.descripcion,
      enlace: nuevoMaterial.enlace,
      fecha: nuevoMaterial.fecha,
      nivel: nuevoMaterial.nivel,
      grado: nuevoMaterial.grado,
      seccion: nuevoMaterial.seccion,
      materia: nuevoMaterial.materia,
      docenteId: nuevoMaterial.docenteId,
      docente: `${nuevoMaterial.docente.user.nombre} ${nuevoMaterial.docente.user.apellido || ''}`.trim(),
      estudiantesAsignados,
      createdAt: nuevoMaterial.createdAt,
      updatedAt: nuevoMaterial.updatedAt
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear material:', error);
    return NextResponse.json(
      { error: 'Error al crear el material' },
      { status: 500 }
    );
  }
}