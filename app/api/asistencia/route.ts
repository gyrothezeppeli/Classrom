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
      if (fechaDesde) {
        const desde = new Date(fechaDesde);
        desde.setHours(0, 0, 0, 0);
        where.fecha.gte = desde;
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        where.fecha.lte = hasta;
      }
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
// POST - Crear o actualizar una sesión de asistencia
// (Opción B: un solo registro por día/curso/materia)
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

    // ✅ Normalizar la fecha a medianoche local
    const fechaNormalizada = new Date(
      fechaFinal.getFullYear(),
      fechaFinal.getMonth(),
      fechaFinal.getDate()
    );

    // ✅ Buscar si ya existe una asistencia para ese día/curso/materia
    // @ts-ignore - Prisma Client aún no regenerado con el modelo Asistencia
    const existente = await prisma.asistencia.findFirst({
      where: {
        nivel, grado, seccion, materia,
        fecha: {
          gte: fechaNormalizada,
          lt: new Date(fechaNormalizada.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: { estudiantes: true }
    });

    let resultadoAsistencia: any;
    let actualizada = false;

    if (existente) {
      // ✅ Ya existe: actualizar en lugar de crear
      // 1. Borrar registros de estudiantes anteriores
      // @ts-ignore - Prisma Client aún no regenerado con el modelo AsistenciaEstudiante
      await prisma.asistenciaEstudiante.deleteMany({
        where: { asistenciaId: existente.id }
      });

      // 2. Actualizar la asistencia con los nuevos datos
      // @ts-ignore - Prisma Client aún no regenerado con el modelo Asistencia
      resultadoAsistencia = await prisma.asistencia.update({
        where: { id: existente.id },
        data: {
          docenteId,
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

      actualizada = true;
      console.log(`♻️ Asistencia actualizada: ${materia} - ${grado} ${seccion} - ${fechaNormalizada.toLocaleDateString()}`);
    } else {
      // ✅ No existe: crear nueva
      // @ts-ignore - Prisma Client aún no regenerado con el modelo Asistencia
      resultadoAsistencia = await prisma.asistencia.create({
        data: {
          fecha: fechaNormalizada,
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

      console.log(`✅ Asistencia registrada: ${materia} - ${grado} ${seccion} - ${fechaNormalizada.toLocaleDateString()}`);
    }

    const presentes = resultadoAsistencia.estudiantes.filter((e: any) => e.asistio).length;
    const ausentes = resultadoAsistencia.estudiantes.filter((e: any) => !e.asistio).length;

    return NextResponse.json({
      id: resultadoAsistencia.id,
      actualizada,
      totalEstudiantes: resultadoAsistencia.estudiantes.length,
      presentes,
      ausentes,
    }, { status: actualizada ? 200 : 201 });
  } catch (error) {
    console.error('Error al guardar asistencia:', error);
    return NextResponse.json({ error: 'Error al guardar la asistencia' }, { status: 500 });
  }
}