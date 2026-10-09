// app/api/notas/docentes/exportar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';

interface FilaExcel {
  'Cédula': string;
  'Apellidos': string;
  'Nombres': string;
  'Materia': string;
  'Nivel': string;
  'Grado': string;
  'Sección': string;
  'Período': string;
  'Nota': number;
  'Observación': string;
  'Docente': string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const seccion = searchParams.get('seccion');
    const materia = searchParams.get('materia');
    const periodo = searchParams.get('periodo');
    const docenteNombre = searchParams.get('docente');

    const where: Record<string, unknown> = {};
    if (nivel) where.nivel = nivel;
    if (grado) where.grado = grado;
    if (seccion) where.seccion = seccion;
    if (materia) where.materia = materia;
    if (periodo) where.periodo = periodo;

    if (!docenteNombre) {
      where.docenteId = { not: null };
    }

    const notas = await prisma.nota.findMany({
      where,
      include: {
        estudiante: {
          select: {
            cedulaIdentidad: true,
            user: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
        docente: {
          select: {
            user: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
      },
    });

    let datos: FilaExcel[] = notas.map((n): FilaExcel => {
      const nombreDocente = n.docente?.user
        ? `${n.docente.user.nombre} ${n.docente.user.apellido ?? ''}`.trim()
        : 'No asignado';

      return {
        'Cédula': n.estudiante?.cedulaIdentidad ?? '',
        'Apellidos': n.estudiante?.user?.apellido ?? '',
        'Nombres': n.estudiante?.user?.nombre ?? '',
        'Materia': n.materia,
        'Nivel': n.nivel,
        'Grado': n.grado,
        'Sección': n.seccion,
        'Período': n.periodo,
        'Nota': n.nota,
        'Observación': n.observacion ?? '',
        'Docente': nombreDocente,
      };
    });

    if (docenteNombre) {
      datos = datos.filter(
        (d) => d['Docente'].toLowerCase() === docenteNombre.toLowerCase()
      );
    }

    datos.sort((a, b) =>
      (a['Apellidos'] || '').localeCompare(b['Apellidos'] || '')
    );

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Notas Docentes');

    worksheet['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 25 },
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
      { wch: 8 }, { wch: 30 }, { wch: 25 },
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Notas-Docentes-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error al exportar:', error);
    return NextResponse.json(
      { error: 'Error al exportar' },
      { status: 500 }
    );
  }
}