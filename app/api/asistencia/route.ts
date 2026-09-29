// app/api/asistencia/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// ============================================
// GET - Listar asistencias
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const docenteId = searchParams.get('docenteId');
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const seccion = searchParams.get('seccion');
    const materia = searchParams.get('materia');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    const where: any = {};
    if (docenteId) where.docenteId = docenteId;
    if (nivel) where.nivel = nivel;
    if (grado) where.grado = grado;
    if (seccion) where.seccion = seccion;
    if (materia) where.materia = materia;

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
    }

    // @ts-ignore - Prisma Client aún no regenerado con el modelo Asistencia
    const asistencias = await prisma.asistencia.findMany({
      where,
      include: {
        docente: {
          include: { user: { select: { nombre: true, apellido: true } } }
        },
        _count: { select: { estudiantes: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    const formateadas = asistencias.map((a: any) => ({
      id: a.id,
      fecha: a.fecha,
      nivel: a.nivel,
      grado: a.grado,
      seccion: a.seccion,
      materia: a.materia,
      hora: a.hora,
      observaciones: a.observaciones,
      docenteId: a.docenteId,
      docente: `${a.docente.user.nombre} ${a.docente.user.apellido || ''}`.trim(),
      totalEstudiantes: a._count.estudiantes,
      createdAt: a.createdAt,
    }));

    return NextResponse.json(formateadas);
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    return NextResponse.json({ error: 'Error al obtener asistencias' }, { status: 500 });
  }
}

// ============================================
// POST - Crear una sesión de asistencia
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nivel, grado, seccion, materia, docenteId,
      fecha, hora, observaciones,
      asistencias
    } = body;

    if (!nivel || !grado || !seccion || !materia || !docenteId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    if (!Array.isArray(asistencias) || asistencias.length === 0) {
      return NextResponse.json({ error: 'Debe incluir al menos un estudiante' }, { status: 400 });
    }

    const fechaFinal = fecha ? new Date(fecha) : new Date();

    // @ts-ignore - Prisma Client aún no regenerado con el modelo Asistencia
    const nuevaAsistencia = await prisma.asistencia.create({
      data: {
        fecha: fechaFinal,
        nivel, grado, seccion, materia, docenteId,
        hora: hora || null,
        observaciones: observaciones || null,
        estudiantes: {
          create: asistencias.map((a: any) => ({
            estudianteId: a.estudianteId,
            asistio: Boolean(a.asistio),
          }))
        }
      },
      include: { estudiantes: true }
    });

    const presentes = nuevaAsistencia.estudiantes.filter((e: any) => e.asistio).length;
    const ausentes = nuevaAsistencia.estudiantes.filter((e: any) => !e.asistio).length;

    console.log(`✅ Asistencia registrada: ${presentes} presentes, ${ausentes} ausentes`);

    return NextResponse.json({
      id: nuevaAsistencia.id,
      totalEstudiantes: nuevaAsistencia.estudiantes.length,
      presentes,
      ausentes,
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear asistencia:', error);
    return NextResponse.json({ error: 'Error al crear la asistencia' }, { status: 500 });
  }
}