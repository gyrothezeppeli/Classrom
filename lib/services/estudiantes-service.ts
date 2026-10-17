import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import bcrypt from 'bcryptjs';

import { StudentAssignmentService } from '@/lib/asignar';

import {
  normalizarGrado,
  esGradoValido,
  NIVELES_VALIDOS,
  SECCIONES_VALIDAS,
  GRADOS_POR_NIVEL
} from '@/lib/normalizar';

export class EstudiantesService {
  constructor(private readonly prismaClient: typeof prisma = prisma) {}


  async GET() {
  try {
    const estudiantes = await this.prismaClient.estudiante.findMany({
      include: {
        user: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
            telefono: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const estudiantesFormateados = estudiantes.map((est) => ({
      id: est.id,
      userId: est.userId,
      cedulaIdentidad: est.cedulaIdentidad || '',
      nombres: est.user?.nombre || '',
      apellidos: est.user?.apellido || '',
      correoElectronico: est.user?.email || '',
      numeroTelefonoCelular: est.user?.telefono || '',
      nivel: est.nivel || '',
      grado: est.grado || '',
      seccion: est.seccion || '',
      fechaNacimiento: ''
    }));

    return NextResponse.json(estudiantesFormateados);
  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    return NextResponse.json(
      { error: "Error al obtener estudiantes" },
      { status: 500 }
    );
  }
}

  async POST(req: NextRequest) {
  try {
    const data = await req.json();

    console.log("📥 Datos recibidos en POST /api/estudiantes:", JSON.stringify(data, null, 2));

    // ============================================
    // 1. Validaciones básicas de campos requeridos
    // ============================================
    if (!data.email || !data.password || !data.nombre || !data.apellido) {
      console.error("❌ Faltan campos requeridos");
      return NextResponse.json(
        { error: "Faltan campos requeridos: email, password, nombre, apellido" },
        { status: 400 }
      );
    }

    // ============================================
    // 2. Validar y normalizar NIVEL
    // ============================================
    const nivelInput = (data.nivel || '').toLowerCase().trim();

    if (!nivelInput) {
      return NextResponse.json(
        { error: 'El campo "nivel" es obligatorio' },
        { status: 400 }
      );
    }

    if (!NIVELES_VALIDOS.includes(nivelInput)) {
      return NextResponse.json(
        {
          error: `Nivel inválido: "${data.nivel}". Los niveles permitidos son: ${NIVELES_VALIDOS.join(', ')}`
        },
        { status: 400 }
      );
    }

    // ============================================
    // 3. Validar y normalizar GRADO
    // ============================================
    const gradoInput = (data.grado || '').trim();

    if (!gradoInput) {
      return NextResponse.json(
        { error: 'El campo "grado" es obligatorio' },
        { status: 400 }
      );
    }

    // Normalizar el grado (ej: "1ro" → "1er Año")
    const gradoNormalizado = normalizarGrado(gradoInput, nivelInput);

    // Validar que el grado resultante sea válido para el nivel
    if (!esGradoValido(gradoNormalizado, nivelInput)) {
      return NextResponse.json(
        {
          error: `Grado inválido: "${data.grado}". Para el nivel "${nivelInput}", los grados válidos son: ${GRADOS_POR_NIVEL[nivelInput].join(', ')}`
        },
        { status: 400 }
      );
    }

    // ============================================
    // 4. Validar y normalizar SECCIÓN
    // ============================================
    const seccionInput = (data.seccion || '').toUpperCase().trim();

    if (!seccionInput) {
      return NextResponse.json(
        { error: 'El campo "seccion" es obligatorio' },
        { status: 400 }
      );
    }

    if (!SECCIONES_VALIDAS.includes(seccionInput)) {
      return NextResponse.json(
        {
          error: `Sección inválida: "${data.seccion}". Las secciones permitidas son: ${SECCIONES_VALIDAS.join(', ')}`
        },
        { status: 400 }
      );
    }

    // ✅ Sobrescribir con los valores normalizados
    data.nivel = nivelInput;
    data.grado = gradoNormalizado;
    data.seccion = seccionInput;

    console.log(`✅ Datos normalizados → nivel: "${nivelInput}", grado: "${gradoNormalizado}", seccion: "${seccionInput}"`);

    // ============================================
    // 5. Verificar que el email no exista
    // ============================================
    const existingUser = await this.prismaClient.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      );
    }

    // ============================================
    // 6. Verificar que la cédula no exista
    // ============================================
    if (data.cedulaIdentidad) {
      const existingCedula = await this.prismaClient.estudiante.findUnique({
        where: { cedulaIdentidad: data.cedulaIdentidad }
      });

      if (existingCedula) {
        return NextResponse.json(
          { error: "La cédula ya está registrada" },
          { status: 400 }
        );
      }
    }

    // ============================================
    // 7. Hashear contraseña
    // ============================================
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // ============================================
    // 8. Crear el usuario y el estudiante en una transacción
    // ============================================
    const estudiante = await this.prismaClient.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          nombre: data.nombre,
          apellido: data.apellido || null,
          telefono: data.numeroTelefonoCelular || null,
          role: "ESTUDIANTE"
        }
      });

      const estudiante = await tx.estudiante.create({
        data: {
          userId: user.id,
          cedulaIdentidad: data.cedulaIdentidad || null,
          nivel: data.nivel,
          grado: data.grado,
          seccion: data.seccion,
        },
        include: {
          user: {
            select: {
              nombre: true,
              apellido: true,
              email: true,
              telefono: true,
              createdAt: true,
            },
          },
        }
      });

      return estudiante;
    });

    console.log(`✅ Estudiante creado: ${estudiante.user.nombre} ${estudiante.user.apellido} | ${estudiante.nivel} ${estudiante.grado} ${estudiante.seccion}`);

    const asignaciones = await new StudentAssignmentService(this.prismaClient)
      .assignExistingContent(estudiante);
    console.log(
      `🎉 Total asignado a ${estudiante.user.nombre}: ${asignaciones.planes} planes, ` +
      `${asignaciones.tareas} tareas, ${asignaciones.avisos} avisos, ` +
      `${asignaciones.materiales} materiales`
    );

    // ============================================
    // 13. Respuesta exitosa
    // ============================================
    return NextResponse.json({
      id: estudiante.id,
      userId: estudiante.userId,
      cedulaIdentidad: estudiante.cedulaIdentidad || '',
      nombre: estudiante.user.nombre,
      apellido: estudiante.user.apellido,
      email: estudiante.user.email,
      telefono: estudiante.user.telefono,
      nivel: estudiante.nivel,
      grado: estudiante.grado,
      seccion: estudiante.seccion,
      createdAt: estudiante.user.createdAt,
      asignaciones: {
        ...asignaciones,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Error al crear estudiante:", error);
    return NextResponse.json(
      { error: "Error al crear estudiante", details: (error as Error).message },
      { status: 500 }
    );
  }
}

}

export const estudiantesService = new EstudiantesService();