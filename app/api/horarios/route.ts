// app/api/horarios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Listar horarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const docenteId = searchParams.get('docenteId');
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const seccion = searchParams.get('seccion');
    const agrupado = searchParams.get('agrupado') === 'true';

    const where: any = {};
    if (docenteId) where.docenteId = docenteId;
    if (nivel) where.nivel = nivel;
    if (grado) where.grado = grado;
    if (seccion) where.seccion = seccion;

    const horarios = await prisma.horario.findMany({
      where,
      include: {
        docente: {
          include: {
            user: {
              select: {
                nombre: true,
                apellido: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { diaSemana: 'asc' },
        { horaInicio: 'asc' },
      ],
    });

    const horariosFormateados = horarios.map((h) => ({
      id: h.id,
      diaSemana: h.diaSemana,
      horaInicio: h.horaInicio,
      horaFin: h.horaFin,
      materia: h.materia,
      docenteId: h.docenteId,
      docente: `${h.docente.user.nombre} ${h.docente.user.apellido || ''}`.trim(),
      docenteEmail: h.docente.user.email,
      nivel: h.nivel,
      grado: h.grado,
      seccion: h.seccion,
      aula: h.aula || '',
      anioAcademico: h.anioAcademico,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
    }));

    // Si se pide agrupado, devolvemos por nivel/grado/sección
    if (agrupado) {
      const agrupado: Record<string, {
        nivel: string;
        grado: string;
        seccion: string;
        anioAcademico: string;
        bloques: typeof horariosFormateados;
      }> = {};

      for (const h of horariosFormateados) {
        const key = `${h.nivel}|${h.grado}|${h.seccion}|${h.anioAcademico}`;
        if (!agrupado[key]) {
          agrupado[key] = {
            nivel: h.nivel,
            grado: h.grado,
            seccion: h.seccion,
            anioAcademico: h.anioAcademico,
            bloques: [],
          };
        }
        agrupado[key].bloques.push(h);
      }

      return NextResponse.json(Object.values(agrupado));
    }

    return NextResponse.json(horariosFormateados);
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener los horarios' },
      { status: 500 }
    );
  }
}

// POST - Crear horario (acepta 1 bloque o un array de bloques)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Detectar si es un solo bloque o un array
    const bloques: any[] = Array.isArray(body) ? body : [body];

    if (bloques.length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron bloques de horario' },
        { status: 400 }
      );
    }

    // Validar campos requeridos
    for (const bloque of bloques) {
      const {
        diaSemana,
        horaInicio,
        horaFin,
        materia,
        docenteId,
        nivel,
        grado,
      } = bloque;

      if (
        !diaSemana ||
        !horaInicio ||
        !horaFin ||
        !materia ||
        !docenteId ||
        !nivel ||
        !grado
      ) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos en uno o más bloques' },
          { status: 400 }
        );
      }
    }

    // ✅ Crear todos los bloques en una transacción
    const creados = await prisma.$transaction(
      bloques.map((bloque) =>
        prisma.horario.create({
          data: {
            diaSemana: bloque.diaSemana,
            horaInicio: bloque.horaInicio,
            horaFin: bloque.horaFin,
            materia: bloque.materia,
            docenteId: bloque.docenteId,
            nivel: bloque.nivel,
            grado: bloque.grado,
            seccion: bloque.seccion || 'A',
            aula: bloque.aula || null,
            anioAcademico: bloque.anioAcademico || '2024-2025',
          },
        })
      )
    );

    return NextResponse.json(
      {
        success: true,
        total: creados.length,
        bloques: creados,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear horario:', error);
    return NextResponse.json(
      { error: 'Error al crear el horario' },
      { status: 500 }
    );
  }
}