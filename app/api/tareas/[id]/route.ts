// app/api/tareas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ============================================
// Utilidades de normalización
// ============================================
const normalizar = (valor: string): string => {
  if (!valor) return '';
  return valor
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_]+/g, ' ');
};

const variantesNivel = (nivel: string): string[] => {
  const n = normalizar(nivel);
  const mapa: Record<string, string[]> = {
    inicial: ['inicial', 'preescolar', 'educacion inicial'],
    primaria: ['primaria', 'educacion primaria'],
    media: ['media', 'bachillerato', 'educacion media'],
  };
  return mapa[n] || [n];
};

const variantesGrado = (grado: string): string[] => {
  const g = normalizar(grado);
  const mapa: Record<string, string[]> = {
    '1er ano': ['1er ano', '1ro', '1er año', '1'],
    '2do ano': ['2do ano', '2do', '2do año', '2'],
    '3er ano': ['3er ano', '3ro', '3er año', '3'],
    '4to ano': ['4to ano', '4to', '4to año', '4'],
    '5to ano': ['5to ano', '5to', '5to año', '5'],
    '1er grado': ['1er grado', '1ro', '1'],
    '2do grado': ['2do grado', '2do', '2'],
    '3er grado': ['3er grado', '3ro', '3'],
    '4to grado': ['4to grado', '4to', '4'],
    '5to grado': ['5to grado', '5to', '5'],
    '6to grado': ['6to grado', '6to', '6'],
    '1er nivel': ['1er nivel', '1er_nivel', '1ro nivel', '1ro_nivel'],
    '2do nivel': ['2do nivel', '2do_nivel'],
    '3er nivel': ['3er nivel', '3er_nivel', '3ro nivel', '3ro_nivel'],
    prekinder: ['prekinder', 'pre-kinder'],
    kinder: ['kinder'],
    preparatorio: ['preparatorio'],
  };
  return mapa[g] || [g];
};

const coincideNivel = (a: string, b: string) =>
  variantesNivel(a).includes(normalizar(b)) ||
  variantesNivel(b).includes(normalizar(a));

const coincideGrado = (a: string, b: string) =>
  variantesGrado(a).includes(normalizar(b)) ||
  variantesGrado(b).includes(normalizar(a));

const coincideSeccion = (a: string, b: string) => {
  const na = normalizar(a);
  const nb = normalizar(b);

  if (
    na === 'unica' || na === 'única' || na === '' ||
    nb === 'unica' || nb === 'única' || nb === ''
  ) {
    return true;
  }

  return na === nb || na === `seccion ${nb}` || `seccion ${na}` === nb;
};

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
    const tipo = searchParams.get('tipo'); // ✅ NUEVO

    const where: any = {};

    if (nivel) where.nivel = nivel;
    if (grado) where.grado = grado;
    if (seccion) where.seccion = seccion;
    if (docenteId) where.docenteId = docenteId;
    if (tipo) where.tipo = tipo; // ✅ NUEVO

    const tareas = await prisma.tarea.findMany({
      where,
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
        salon: true,
        estudiantes: estudianteId ? {
          where: {
            estudianteId: estudianteId
          },
          select: {
            visto: true,
            entregado: true,
            fechaVisto: true,
            fechaEntrega: true,
            calificacion: true
          }
        } : undefined
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const tareasFormateadas = tareas.map((tarea) => ({
      id: tarea.id,
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      fechaEntrega: tarea.fechaEntrega,
      estado: tarea.estado,
      tipo: tarea.tipo || 'tarea', // ✅ NUEVO
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
// POST - Crear una nueva tarea / aviso / material
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
      salonId,
      tipo // ✅ NUEVO
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
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    });

    if (!docente) {
      return NextResponse.json(
        { error: 'Docente no encontrado' },
        { status: 404 }
      );
    }

    if (salonId) {
      const salon = await prisma.salon.findUnique({
        where: { id: salonId }
      });
      if (!salon) {
        return NextResponse.json(
          { error: 'Salón no encontrado' },
          { status: 404 }
        );
      }
    }

    // ✅ 1. Crear la tarea/aviso/material
    const nuevaTarea = await prisma.tarea.create({
      data: {
        titulo,
        descripcion: descripcion || '',
        fechaEntrega,
        estado: 'pendiente',
        tipo: tipo || 'tarea', // ✅ NUEVO
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
              select: {
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        },
        salon: true
      }
    });

    // ✅ 2. Buscar estudiantes que coincidan con nivel + grado + sección
    const todosLosEstudiantes = await prisma.estudiante.findMany();

    const estudiantesCoincidentes = todosLosEstudiantes.filter((est) =>
      coincideNivel(nuevaTarea.nivel, est.nivel) &&
      coincideGrado(nuevaTarea.grado, est.grado) &&
      coincideSeccion(nuevaTarea.seccion, est.seccion)
    );

    // ✅ 3. Crear un EstudianteTarea por cada estudiante que coincide
    // (Aplica para tareas, avisos y materiales por igual)
    if (estudiantesCoincidentes.length > 0) {
      await prisma.estudianteTarea.createMany({
        data: estudiantesCoincidentes.map((est) => ({
          estudianteId: est.id,
          tareaId: nuevaTarea.id,
          visto: false,
          entregado: false,
        })),
        skipDuplicates: true,
      });
    }

    console.log(`✅ [${nuevaTarea.tipo}] "${nuevaTarea.titulo}" creado y asignado a ${estudiantesCoincidentes.length} estudiantes`);
    console.log(`   Nivel: ${nuevaTarea.nivel}, Grado: ${nuevaTarea.grado}, Sección: ${nuevaTarea.seccion}`);

    const respuesta = {
      id: nuevaTarea.id,
      titulo: nuevaTarea.titulo,
      descripcion: nuevaTarea.descripcion,
      fechaEntrega: nuevaTarea.fechaEntrega,
      estado: nuevaTarea.estado,
      tipo: nuevaTarea.tipo || 'tarea', // ✅ NUEVO
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
      estudiantesAsignados: estudiantesCoincidentes.length,
      createdAt: nuevaTarea.createdAt,
      updatedAt: nuevaTarea.updatedAt
    };

    return NextResponse.json(respuesta, { status: 201 });
  } catch (error) {
    console.error('Error al crear tarea:', error);
    return NextResponse.json(
      { error: 'Error al crear la tarea' },
      { status: 500 }
    );
  }
}