import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

interface BloqueHorarioEntrada {
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  materia: string;
  docenteId: string;
  nivel: string;
  grado: string;
  seccion?: string;
  aula?: string;
  anioAcademico?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown): string {
  if (typeof value !== 'string') throw new TypeError('Expected a string');
  return value;
}

function optionalText(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return requiredText(value);
}

export class HorariosService {
  constructor(private readonly prismaClient: typeof prisma = prisma) {}


  async GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const docenteId = searchParams.get('docenteId');
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const seccion = searchParams.get('seccion');
    const agrupado = searchParams.get('agrupado') === 'true';

    const where: Prisma.HorarioWhereInput = {};
    if (docenteId) where.docenteId = docenteId;
    if (nivel) where.nivel = nivel;
    if (grado) where.grado = grado;
    if (seccion) where.seccion = seccion;

    const horarios = await this.prismaClient.horario.findMany({
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

  async POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    // Detectar si es un solo bloque o un array
    const bloques: unknown[] = Array.isArray(body) ? body : [body];

    if (bloques.length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron bloques de horario' },
        { status: 400 }
      );
    }

    // Validar campos requeridos
    for (const entrada of bloques) {
      if (entrada === null) throw new TypeError('Invalid schedule payload');
      const bloque = isRecord(entrada) ? entrada : {};
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

    const bloquesValidados: BloqueHorarioEntrada[] = bloques.map((entrada) => {
      const bloque = isRecord(entrada) ? entrada : {};
      return {
        diaSemana: requiredText(bloque.diaSemana),
        horaInicio: requiredText(bloque.horaInicio),
        horaFin: requiredText(bloque.horaFin),
        materia: requiredText(bloque.materia),
        docenteId: requiredText(bloque.docenteId),
        nivel: requiredText(bloque.nivel),
        grado: requiredText(bloque.grado),
        seccion: optionalText(bloque.seccion),
        aula: optionalText(bloque.aula),
        anioAcademico: optionalText(bloque.anioAcademico),
      };
    });

    // ✅ Crear todos los bloques en una transacción
    const creados = await this.prismaClient.$transaction(
      bloquesValidados.map((bloque) =>
        this.prismaClient.horario.create({
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

}

export const horariosService = new HorariosService();