import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export class NotasService {
  constructor(private readonly prismaClient: typeof prisma = prisma) {}


  async GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const seccion = searchParams.get('seccion');
    const materia = searchParams.get('materia');
    const periodo = searchParams.get('periodo');

    const where: Prisma.NotaWhereInput = {};
    if (nivel) where.nivel = nivel;
    if (grado) where.grado = grado;
    if (seccion) where.seccion = seccion;
    if (materia) where.materia = materia;
    if (periodo) where.periodo = periodo;

    const notas = await this.prismaClient.nota.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notas);
  } catch (error) {
    console.error('Error GET /api/notas:', error);
    return NextResponse.json(
      { error: 'Error al obtener notas' },
      { status: 500 }
    );
  }
}

  async POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { notas } = body;

    if (!Array.isArray(notas) || notas.length === 0) {
      return NextResponse.json(
        { error: 'No hay notas para guardar' },
        { status: 400 }
      );
    }

    const resultados = [];

    for (const notaData of notas) {
      const {
        estudianteId,
        materia,
        nivel,
        grado,
        seccion,
        nota,
        observacion,
        docenteId,
        periodo,
      } = notaData;

      // Validaciones básicas
      if (!estudianteId || !materia || !nivel || !grado || !seccion || !periodo) {
        continue;
      }

      const notaNum = parseFloat(nota);
      if (isNaN(notaNum) || notaNum < 0 || notaNum > 20) {
        continue;
      }

      // Upsert usando la clave compuesta única
      const resultado = await this.prismaClient.nota.upsert({
        where: {
          estudianteId_materia_nivel_grado_seccion_periodo: {
            estudianteId,
            materia,
            nivel,
            grado,
            seccion,
            periodo,
          },
        },
        update: {
          nota: notaNum,
          observacion: observacion || '',
          docenteId: docenteId || null,
        },
        create: {
          estudianteId,
          materia,
          nivel,
          grado,
          seccion,
          periodo,
          nota: notaNum,
          observacion: observacion || '',
          docenteId: docenteId || null,
        },
      });

      resultados.push(resultado);
    }

    return NextResponse.json({
      success: true,
      guardadas: resultados.length,
      notas: resultados,
    });
  } catch (error) {
    console.error('Error POST /api/notas:', error);
    return NextResponse.json(
      { error: 'Error al guardar notas' },
      { status: 500 }
    );
  }
}

}

export const notasService = new NotasService();