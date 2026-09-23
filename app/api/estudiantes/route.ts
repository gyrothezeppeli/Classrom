// app/api/estudiantes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ============ GET - Listar todos los estudiantes ============
export async function GET() {
  try {
    const estudiantes = await prisma.estudiante.findMany({
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

// ============ POST - Crear un estudiante ============
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    console.log("📥 Datos recibidos en POST /api/estudiantes:", JSON.stringify(data, null, 2));

    if (!data.email || !data.password || !data.nombre || !data.apellido) {
      console.error("❌ Faltan campos requeridos");
      return NextResponse.json(
        { error: "Faltan campos requeridos: email, password, nombre, apellido" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      );
    }

    if (data.cedulaIdentidad) {
      const existingCedula = await prisma.estudiante.findUnique({
        where: { cedulaIdentidad: data.cedulaIdentidad }
      });

      if (existingCedula) {
        return NextResponse.json(
          { error: "La cédula ya está registrada" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const estudiante = await prisma.$transaction(async (tx) => {
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
          nivel: data.nivel || "",
          grado: data.grado || "",
          seccion: data.seccion || "",
        },
        include: {
          user: true
        }
      });

      return estudiante;
    });

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
      createdAt: estudiante.user.createdAt
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Error al crear estudiante:", error);
    return NextResponse.json(
      { error: "Error al crear estudiante", details: (error as Error).message },
      { status: 500 }
    );
  }
}