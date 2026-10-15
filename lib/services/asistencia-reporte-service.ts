import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AsistenciaWhere, asistenciaPrisma } from '@/lib/services/asistencia-prisma';

export class AsistenciaReporteService {
  constructor(
    private readonly prismaClient: typeof prisma = prisma,
    private readonly attendanceClient: typeof asistenciaPrisma = asistenciaPrisma,
  ) {}


  async GET(request: NextRequest) {
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

    const estudiantesWhere: Prisma.EstudianteWhereInput = {};
    if (nivel) estudiantesWhere.nivel = nivel;
    if (grado) estudiantesWhere.grado = grado;
    if (seccion) estudiantesWhere.seccion = seccion;

    const estudiantes = await this.prismaClient.estudiante.findMany({
      where: estudiantesWhere,
      include: { user: { select: { nombre: true, apellido: true } } }
    });

    const where: AsistenciaWhere = { fecha: { gte: fechaDesde, lte: fechaHasta } };
    if (nivel) where.nivel = nivel;
    if (grado) where.grado = grado;
    if (seccion) where.seccion = seccion;
    if (materia) where.materia = materia;

    const asistencias = await this.attendanceClient.asistencia.findMany({
      where,
      include: { estudiantes: true }
    });

    const reporte = estudiantes.map((est) => {
      const registros = asistencias
        .map((a) => a.estudiantes!.find((e) => e.estudianteId === est.id))
        .filter(Boolean);

      const totalClases = registros.length;
      const presentes = registros.filter((r) => r!.asistio).length;
      const ausentes = registros.filter((r) => !r!.asistio).length;

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

    reporte.sort((a, b) => b.porcentajeInasistencia - a.porcentajeInasistencia);

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

}

export const asistenciaReporteService = new AsistenciaReporteService();