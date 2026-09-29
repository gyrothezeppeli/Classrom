// app/api/asistencia/reporte/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const seccion = searchParams.get('seccion');
    const materia = searchParams.get('materia');
    const mes = searchParams.get('mes');

    if (!mes) {
      return NextResponse.json({ error: 'Falta mes (YYYY-MM)' }, { status: 400 });
    }

    const [year, month] = mes.split('-').map(Number);
    const fechaDesde = new Date(year, month - 1, 1);
    const fechaHasta = new Date(year, month, 0, 23, 59, 59);

    const estudiantesWhere: any = {};
    if (nivel) estudiantesWhere.nivel = nivel;
    if (grado) estudiantesWhere.grado = grado;
    if (seccion) estudiantesWhere.seccion = seccion;

    const estudiantes = await prisma.estudiante.findMany({
      where: estudiantesWhere,
      include: { user: { select: { nombre: true, apellido: true } } }
    });

    const where: any = { fecha: { gte: fechaDesde, lte: fechaHasta } };
    if (nivel) where.nivel = nivel;
    if (grado) where.grado = grado;
    if (seccion) where.seccion = seccion;
    if (materia) where.materia = materia;

    // @ts-ignore - Prisma Client aún no regenerado con el modelo Asistencia
    const asistencias = await prisma.asistencia.findMany({
      where,
      include: { estudiantes: true }
    });

    const reporte = estudiantes.map((est: any) => {
      const registros = asistencias
        .map((a: any) => a.estudiantes.find((e: any) => e.estudianteId === est.id))
        .filter(Boolean);

      const totalClases = registros.length;
      const presentes = registros.filter((r: any) => r.asistio).length;
      const ausentes = registros.filter((r: any) => !r.asistio).length;

      const porcentajeInasistencia = totalClases > 0
        ? (ausentes / totalClases) * 100
        : 0;

      return {
        estudianteId: est.id,
        nombres: est.user.nombre,
        apellidos: est.user.apellido || '',
        cedulaIdentidad: est.cedulaIdentidad || '',
        totalClases,
        presentes,
        ausentes,
        porcentajeInasistencia: parseFloat(porcentajeInasistencia.toFixed(2)),
      };
    });

    reporte.sort((a: any, b: any) => b.porcentajeInasistencia - a.porcentajeInasistencia);

    return NextResponse.json({
      mes,
      totalSesiones: asistencias.length,
      totalEstudiantes: estudiantes.length,
      reporte,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 });
  }
}