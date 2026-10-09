// app/api/notas/docentes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface NotaDocente {
  id: string;
  estudianteId: string;
  cedulaIdentidad: string;
  nombres: string;
  apellidos: string;
  materia: string;
  nivel: string;
  grado: string;
  seccion: string;
  periodo: string;
  nota: number;
  observacion: string | null;
  docente: string | null;
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

    let resultado: NotaDocente[] = notas.map((n): NotaDocente => {
      const nombreEstudiante = n.estudiante?.user?.nombre ?? '';
      const apellidoEstudiante = n.estudiante?.user?.apellido ?? '';
      const nombreDocente = n.docente?.user
        ? `${n.docente.user.nombre} ${n.docente.user.apellido ?? ''}`.trim()
        : null;

      return {
        id: n.id,
        estudianteId: n.estudianteId,
        cedulaIdentidad: n.estudiante?.cedulaIdentidad ?? '',
        nombres: nombreEstudiante,
        apellidos: apellidoEstudiante,
        materia: n.materia,
        nivel: n.nivel,
        grado: n.grado,
        seccion: n.seccion,
        periodo: n.periodo,
        nota: n.nota,
        observacion: n.observacion,
        docente: nombreDocente,
      };
    });

    if (docenteNombre) {
      resultado = resultado.filter(
        (n) => (n.docente ?? '').toLowerCase() === docenteNombre.toLowerCase()
      );
    }

    resultado.sort((a, b) =>
      (a.apellidos || '').localeCompare(b.apellidos || '')
    );

    return NextResponse.json({ notas: resultado });
  } catch (error) {
    console.error('Error al obtener notas de docentes:', error);
    return NextResponse.json(
      { error: 'Error al obtener notas' },
      { status: 500 }
    );
  }
}