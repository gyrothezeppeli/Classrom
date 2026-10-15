import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { AsistenciaWhere, asistenciaPrisma } from '@/lib/services/asistencia-prisma';

interface SesionArchivada {
  id: string;
  fecha: Date;
  materia: string;
  nivel: string;
  grado: string;
  seccion: string;
  docente: string;
  presentes: number;
  ausentes: number;
}

interface MesArchivado {
  mes: string;
  mesNombre: string;
  sesiones: SesionArchivada[];
  totalSesiones: number;
  totalRegistros: number;
}

interface ReporteEstudiante {
  estudianteId: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  nivel: string;
  grado: string;
  seccion: string;
  totalClases: number;
  presentes: number;
  ausentes: number;
  porcentajeInasistencia: number;
}

interface ResumenSalon {
  salonKey: string;
  nivel: string;
  grado: string;
  seccion: string;
  nombreSalon: string;
  estudiantes: ReporteEstudiante[];
  totalEstudiantes: number;
  totalClases: number;
  totalPresentes: number;
  totalAusentes: number;
  promedioInasistencia: number;
}

export class AsistenciaArchivarService {
  constructor(
    private readonly prismaClient: typeof prisma = prisma,
    private readonly attendanceClient: typeof asistenciaPrisma = asistenciaPrisma,
  ) {}


  async POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-admin-token');
    if (!authHeader || authHeader !== process.env.ADMIN_ARCHIVE_TOKEN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { fechaLimite, confirmar, backupDescargado } = body;

    if (!confirmar) {
      return NextResponse.json(
        { error: 'Debes enviar confirmar: true para ejecutar la limpieza' },
        { status: 400 }
      );
    }

    if (!backupDescargado) {
      return NextResponse.json(
        {
          error: 'Debes confirmar que el PDF de respaldo fue descargado antes de eliminar',
          codigo: 'BACKUP_NO_CONFIRMADO',
        },
        { status: 400 }
      );
    }

    if (!fechaLimite) {
      return NextResponse.json(
        { error: 'Falta fechaLimite (formato: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const limite = new Date(fechaLimite);
    limite.setHours(23, 59, 59, 999);

    const totalAsistencias = await this.attendanceClient.asistencia.count({
      where: { fecha: { lte: limite } },
    });

    const totalRegistros = await this.attendanceClient.asistenciaEstudiante.count({
      where: {
        asistencia: { fecha: { lte: limite } },
      },
    });

    if (totalAsistencias === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No hay asistencias que eliminar',
        asistenciasEliminadas: 0,
      });
    }

    const resultado = await this.attendanceClient.asistencia.deleteMany({
      where: { fecha: { lte: limite } },
    });

    console.log(`🗑️ Limpieza ejecutada: ${resultado.count} asistencias (${totalRegistros} registros de estudiantes)`);
    console.log(`   Fecha límite: ${fechaLimite}`);

    return NextResponse.json({
      ok: true,
      fechaLimite,
      asistenciasEliminadas: resultado.count,
      registrosEliminados: totalRegistros,
      message: `Se eliminaron ${resultado.count} sesiones de asistencia anteriores al ${fechaLimite}`,
    });
  } catch (error) {
    console.error('Error al archivar asistencias:', error);
    return NextResponse.json(
      { error: 'Error al archivar asistencias' },
      { status: 500 }
    );
  }
}

  async GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-admin-token');
    if (!authHeader || authHeader !== process.env.ADMIN_ARCHIVE_TOKEN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fechaLimite = searchParams.get('fechaLimite');
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const seccion = searchParams.get('seccion');

    if (!fechaLimite) {
      return NextResponse.json({ error: 'Falta fechaLimite' }, { status: 400 });
    }

    const limite = new Date(fechaLimite);
    limite.setHours(23, 59, 59, 999);

    const where: AsistenciaWhere = { fecha: { lte: limite } };
    if (nivel) where.nivel = nivel;
    if (grado) where.grado = grado;
    if (seccion) where.seccion = seccion;

    // ✅ 1. Todas las asistencias con sus estudiantes
    const asistencias = await this.attendanceClient.asistencia.findMany({
      where,
      include: {
        docente: {
          include: { user: { select: { nombre: true, apellido: true } } },
        },
        estudiantes: {
          include: {
            estudiante: {
              include: { user: { select: { nombre: true, apellido: true } } },
            },
          },
        },
      },
      orderBy: { fecha: 'asc' },
    });

    // ✅ 2. Agrupar por mes
    const porMes: Record<string, MesArchivado> = {};

    asistencias.forEach((a) => {
      const fecha = new Date(a.fecha);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      if (!porMes[mesKey]) {
        porMes[mesKey] = {
          mes: mesKey,
          mesNombre: fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
          sesiones: [],
          totalSesiones: 0,
          totalRegistros: 0,
        };
      }

      porMes[mesKey].sesiones.push({
        id: a.id,
        fecha: a.fecha,
        materia: a.materia,
        nivel: a.nivel,
        grado: a.grado,
        seccion: a.seccion,
        docente: `${a.docente!.user.nombre} ${a.docente!.user.apellido || ''}`.trim(),
        presentes: a.estudiantes!.filter((e) => e.asistio).length,
        ausentes: a.estudiantes!.filter((e) => !e.asistio).length,
      });

      porMes[mesKey].totalSesiones += 1;
      porMes[mesKey].totalRegistros += a.estudiantes!.length;
    });

    // ✅ 3. Reporte POR ESTUDIANTE (individual)
    const estudiantes = await this.prismaClient.estudiante.findMany({
      where: {
        ...(nivel ? { nivel } : {}),
        ...(grado ? { grado } : {}),
        ...(seccion ? { seccion } : {}),
      },
      include: { user: { select: { nombre: true, apellido: true } } },
    });

    const reporteEstudiantes: ReporteEstudiante[] = estudiantes.map((est) => {
      const registrosEstudiante = asistencias
        .flatMap((a) => a.estudiantes!)
        .filter((ae) => ae.estudianteId === est.id);

      const total = registrosEstudiante.length;
      const presentes = registrosEstudiante.filter((r) => r.asistio).length;
      const ausentes = registrosEstudiante.filter((r) => !r.asistio).length;

      // ✅ % INDIVIDUAL del estudiante
      const porcentaje = total > 0 ? (ausentes / total) * 100 : 0;

      return {
        estudianteId: est.id,
        cedula: est.cedulaIdentidad || '-',
        nombres: est.user.nombre,
        apellidos: est.user.apellido || '',
        nivel: est.nivel,
        grado: est.grado,
        seccion: est.seccion,
        totalClases: total,
        presentes,
        ausentes,
        porcentajeInasistencia: parseFloat(porcentaje.toFixed(2)),
      };
    });

    // ✅ 4. Agrupar por salón
    const porSalon: Record<string, ResumenSalon> = {};

    reporteEstudiantes.forEach((est) => {
      const salonKey = `${est.nivel}|${est.grado}|${est.seccion}`;

      if (!porSalon[salonKey]) {
        porSalon[salonKey] = {
          salonKey,
          nivel: est.nivel,
          grado: est.grado,
          seccion: est.seccion,
          nombreSalon: `${est.grado} ${est.seccion} - ${est.nivel}`,
          estudiantes: [],
          totalEstudiantes: 0,
          totalClases: 0,
          totalPresentes: 0,
          totalAusentes: 0,
          promedioInasistencia: 0,
        };
      }

      porSalon[salonKey].estudiantes.push(est);
      porSalon[salonKey].totalClases += est.totalClases;
      porSalon[salonKey].totalPresentes += est.presentes;
      porSalon[salonKey].totalAusentes += est.ausentes;
    });

    // ✅ 5. Calcular promedio del salón
    Object.values(porSalon).forEach((salon) => {
      salon.totalEstudiantes = salon.estudiantes.length;
      salon.promedioInasistencia =
        salon.totalClases > 0
          ? parseFloat(((salon.totalAusentes / salon.totalClases) * 100).toFixed(2))
          : 0;

      salon.estudiantes.sort((a, b) => b.porcentajeInasistencia - a.porcentajeInasistencia);
    });

    const salonesArray = Object.values(porSalon).sort((a, b) =>
      a.nombreSalon.localeCompare(b.nombreSalon)
    );

    return NextResponse.json({
      metadata: {
        fechaLimite,
        fechaGeneracion: new Date().toISOString(),
        totalAsistencias: asistencias.length,
        totalRegistros: asistencias.reduce((sum, a) => sum + a.estudiantes!.length, 0),
        totalSalones: salonesArray.length,
        filtros: { nivel, grado, seccion },
      },
      porMes: Object.values(porMes),
      salones: salonesArray,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}

}

export const asistenciaArchivarService = new AsistenciaArchivarService();