// app/api/asistencia/estudiantes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nivel = searchParams.get('nivel');
    const grado = searchParams.get('grado');
    const seccion = searchParams.get('seccion');

    if (!nivel || !grado || !seccion) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const estudiantes = await prisma.estudiante.findMany({
      where: { nivel, grado, seccion },
      include: {
        user: { select: { nombre: true, apellido: true, email: true } }
      },
      orderBy: [
        { user: { apellido: 'asc' } },
        { user: { nombre: 'asc' } }
      ]
    });

    return NextResponse.json(estudiantes.map((e: any) => ({
      id: e.id,
      nombres: e.user.nombre,
      apellidos: e.user.apellido || '',
      cedulaIdentidad: e.cedulaIdentidad || '',
      correoElectronico: e.user.email,
    })));
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener' }, { status: 500 });
  }
}