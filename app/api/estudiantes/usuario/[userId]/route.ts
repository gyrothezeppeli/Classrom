// app/api/estudiantes/usuario/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    console.log("🔍 Buscando estudiante con userId:", userId);

    const estudiante = await prisma.estudiante.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: {
            email: true,
            nombre: true
          }
        }
      }
    });

    if (!estudiante) {
      console.log("❌ Estudiante no encontrado para userId:", userId);
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 404 }
      );
    }

    console.log("✅ Estudiante encontrado:", estudiante.id);

    const estudianteData = {
      id: estudiante.id,
      nombre: estudiante.nombres,
      apellido: estudiante.apellidos,
      grado: estudiante.grado,
      seccion: estudiante.seccion,
      cedula: estudiante.cedulaIdentidad,
      correo: estudiante.correoElectronico,
      materias: []
    };

    return NextResponse.json(estudianteData);
  } catch (error) {
    console.error("❌ Error al obtener estudiante:", error);
    return NextResponse.json(
      { error: "Error al obtener estudiante" },
      { status: 500 }
    );
  }
}