// app/api/estudiantes/masivo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

interface EstudianteInput {
  cedulaIdentidad: string;
  nombres: string;
  apellidos: string;
  nivel: string;
  grado: string;
  seccion: string;
  correoElectronico?: string;
  numeroTelefonoCelular?: string;
  fechaNacimiento?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const estudiantes: EstudianteInput[] = body.estudiantes || [];

    if (estudiantes.length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron estudiantes' },
        { status: 400 }
      );
    }

    // Validaciones previas
    for (const est of estudiantes) {
      if (
        !est.cedulaIdentidad ||
        !est.nombres ||
        !est.apellidos ||
        !est.nivel ||
        !est.grado ||
        !est.seccion
      ) {
        return NextResponse.json(
          { error: `Faltan datos obligatorios para cédula ${est.cedulaIdentidad || 'desconocida'}` },
          { status: 400 }
        );
      }
    }

    // Verificar duplicados dentro del propio archivo
    const cedulasSet = new Set<string>();
    for (const est of estudiantes) {
      if (cedulasSet.has(est.cedulaIdentidad)) {
        return NextResponse.json(
          { error: `Cédula duplicada en el archivo: ${est.cedulaIdentidad}` },
          { status: 400 }
        );
      }
      cedulasSet.add(est.cedulaIdentidad);
    }

    // Verificar cuáles ya existen en la BD
    const cedulasExistentes = await prisma.estudiante.findMany({
      where: {
        cedulaIdentidad: { in: estudiantes.map((e) => e.cedulaIdentidad) },
      },
      select: { cedulaIdentidad: true },
    });

    if (cedulasExistentes.length > 0) {
      const lista = cedulasExistentes.map((c) => c.cedulaIdentidad).join(', ');
      return NextResponse.json(
        { error: `Estas cédulas ya están registradas: ${lista}` },
        { status: 409 }
      );
    }

    // Verificar emails duplicados también
    const correosAUsar = estudiantes
      .map((e) => e.correoElectronico || `${e.cedulaIdentidad}@instituto.edu`)
      .filter(Boolean);

    const correosExistentes = await prisma.user.findMany({
      where: { email: { in: correosAUsar } },
      select: { email: true },
    });

    if (correosExistentes.length > 0) {
      const lista = correosExistentes.map((c) => c.email).join(', ');
      return NextResponse.json(
        { error: `Estos correos ya están registrados: ${lista}` },
        { status: 409 }
      );
    }

    // Crear todo en transacción
    const resultados = await prisma.$transaction(async (tx) => {
      const creados: Array<{ id: string; cedulaIdentidad: string; nombre: string }> = [];

      for (const est of estudiantes) {
        const email = est.correoElectronico || `${est.cedulaIdentidad}@instituto.edu`;
        const passwordPlano = est.password || est.cedulaIdentidad;
        const passwordHash = await bcrypt.hash(passwordPlano, 10);

        const user = await tx.user.create({
          data: {
            email,
            password: passwordHash,
            nombre: est.nombres,
            apellido: est.apellidos,
            telefono: est.numeroTelefonoCelular || null,
            role: 'ESTUDIANTE',
          },
        });

        const estudiante = await tx.estudiante.create({
          data: {
            userId: user.id,
            cedulaIdentidad: est.cedulaIdentidad,
            nivel: est.nivel,
            grado: est.grado,
            seccion: est.seccion,
          },
        });

        creados.push({
          id: estudiante.id,
          cedulaIdentidad: est.cedulaIdentidad,
          nombre: `${est.nombres} ${est.apellidos}`,
        });
      }

      return creados;
    });

    return NextResponse.json({
      ok: true,
      creados: resultados.length,
      estudiantes: resultados,
    });
  } catch (error: any) {
    console.error('Error al crear estudiantes masivamente:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un estudiante con esa cédula o correo' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al registrar estudiantes' },
      { status: 500 }
    );
  }
}