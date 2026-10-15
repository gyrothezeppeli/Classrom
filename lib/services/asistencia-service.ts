import { NextRequest, NextResponse } from 'next/server';

import {
  AsistenciaCreateData,
  AsistenciaEstudianteCreate,
  AsistenciaWhere,
  asistenciaPrisma,
} from '@/lib/services/asistencia-prisma';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string') throw new TypeError('Expected a string');
  return value;
}

function nullableString(value: unknown): string | null {
  if (!value) return null;
  return requiredString(value);
}

function dateInput(value: unknown): Date {
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  if (typeof value === 'boolean') return new Date(Number(value));
  return new Date(String(value));
}

export class AsistenciaService {
  constructor(private readonly attendanceClient: typeof asistenciaPrisma = asistenciaPrisma) {}


  async GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const docenteId = searchParams.get('docenteId');
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const seccion = searchParams.get('seccion');
    const materia = searchParams.get('materia');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    const where: AsistenciaWhere = {};
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

    const asistencias = await this.attendanceClient.asistencia.findMany({
      where,
      include: {
        docente: {
          include: { user: { select: { nombre: true, apellido: true } } }
        },
        _count: { select: { estudiantes: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    const formateadas = asistencias.map((a) => ({
      id: a.id,
      fecha: a.fecha,
      nivel: a.nivel,
      grado: a.grado,
      seccion: a.seccion,
      materia: a.materia,
      hora: a.hora,
      observaciones: a.observaciones,
      docenteId: a.docenteId,
      docente: `${a.docente!.user.nombre} ${a.docente!.user.apellido || ''}`.trim(),
      totalEstudiantes: a._count!.estudiantes,
      createdAt: a.createdAt,
    }));

    return NextResponse.json(formateadas);
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    return NextResponse.json({ error: 'Error al obtener asistencias' }, { status: 500 });
  }
}

  async POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new TypeError('Invalid attendance payload');
    const { nivel, grado, seccion, materia, docenteId, fecha, hora, observaciones, asistencias } = body;

    if (!nivel || !grado || !seccion || !materia || !docenteId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    if (!Array.isArray(asistencias) || asistencias.length === 0) {
      return NextResponse.json({ error: 'Debe incluir al menos un estudiante' }, { status: 400 });
    }

    const fechaFinal = fecha ? dateInput(fecha) : new Date();

    // ✅ Normalizar la fecha a medianoche local
    const fechaNormalizada = new Date(
      fechaFinal.getFullYear(),
      fechaFinal.getMonth(),
      fechaFinal.getDate()
    );

    // ✅ Buscar si ya existe una asistencia para ese día/curso/materia
    const nivelTexto = requiredString(nivel);
    const gradoTexto = requiredString(grado);
    const seccionTexto = requiredString(seccion);
    const materiaTexto = requiredString(materia);
    const docenteIdTexto = requiredString(docenteId);
    const asistenciasNormalizadas: AsistenciaEstudianteCreate[] = asistencias.map((item: unknown) => {
      if (!isRecord(item)) throw new TypeError('Invalid attendance record');
      return {
        estudianteId: requiredString(item.estudianteId),
        asistio: Boolean(item.asistio),
      };
    });

    const existente = await this.attendanceClient.asistencia.findFirst({
      where: {
        nivel: nivelTexto,
        grado: gradoTexto,
        seccion: seccionTexto,
        materia: materiaTexto,
        fecha: {
          gte: fechaNormalizada,
          lt: new Date(fechaNormalizada.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: { estudiantes: true }
    });

    let resultadoAsistencia;
    let actualizada = false;

    if (existente) {
      // ✅ Ya existe: actualizar en lugar de crear
      // 1. Borrar registros de estudiantes anteriores
      await this.attendanceClient.asistenciaEstudiante.deleteMany({
        where: { asistenciaId: existente.id }
      });

      // 2. Actualizar la asistencia con los nuevos datos
      resultadoAsistencia = await this.attendanceClient.asistencia.update({
        where: { id: existente.id },
        data: {
          docenteId: docenteIdTexto,
          hora: nullableString(hora),
          observaciones: nullableString(observaciones),
          estudiantes: {
            create: asistenciasNormalizadas,
          }
        },
        include: { estudiantes: true }
      });

      actualizada = true;
      console.log(`♻️ Asistencia actualizada: ${materia} - ${grado} ${seccion} - ${fechaNormalizada.toLocaleDateString()}`);
    } else {
      // ✅ No existe: crear nueva
      const data: AsistenciaCreateData = {
          fecha: fechaNormalizada,
          nivel: nivelTexto,
          grado: gradoTexto,
          seccion: seccionTexto,
          materia: materiaTexto,
          docenteId: docenteIdTexto,
          hora: nullableString(hora),
          observaciones: nullableString(observaciones),
          estudiantes: {
            create: asistenciasNormalizadas,
          }
      };
      resultadoAsistencia = await this.attendanceClient.asistencia.create({
        data,
        include: { estudiantes: true }
      });

      console.log(`✅ Asistencia registrada: ${materia} - ${grado} ${seccion} - ${fechaNormalizada.toLocaleDateString()}`);
    }

    const estudiantesResultado = resultadoAsistencia.estudiantes!;
    const presentes = estudiantesResultado.filter((e) => e.asistio).length;
    const ausentes = estudiantesResultado.filter((e) => !e.asistio).length;

    return NextResponse.json({
      id: resultadoAsistencia.id,
      actualizada,
      totalEstudiantes: estudiantesResultado.length,
      presentes,
      ausentes,
    }, { status: actualizada ? 200 : 201 });
  } catch (error) {
    console.error('Error al guardar asistencia:', error);
    return NextResponse.json({ error: 'Error al guardar la asistencia' }, { status: 500 });
  }
}

}

export const asistenciaService = new AsistenciaService();