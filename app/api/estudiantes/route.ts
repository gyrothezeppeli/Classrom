// app/api/estudiantes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    console.log("📥 Datos recibidos en POST /api/estudiantes:", JSON.stringify(data, null, 2));

    // Validar campos requeridos (userId es requerido)
    if (!data.userId) {
      console.error("❌ Faltan userId");
      return NextResponse.json(
        { error: "Faltan campos requeridos: userId" },
        { status: 400 }
      );
    }

    if (!data.nombres || !data.apellidos || !data.correoElectronico) {
      console.error("❌ Faltan campos requeridos:", {
        nombres: !!data.nombres,
        apellidos: !!data.apellidos,
        correoElectronico: !!data.correoElectronico
      });
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      console.error(`❌ Usuario no encontrado: ${data.userId}`);
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya tiene un estudiante
    const existingEstudiante = await prisma.estudiante.findUnique({
      where: { userId: data.userId }
    });

    if (existingEstudiante) {
      console.error(`❌ Usuario ${data.userId} ya tiene estudiante`);
      return NextResponse.json(
        { error: "Este usuario ya tiene un estudiante registrado" },
        { status: 400 }
      );
    }

    // Verificar si la cédula ya existe
    let cedula = data.cedulaIdentidad;
    if (cedula) {
      const cedulaExistente = await prisma.estudiante.findUnique({
        where: { cedulaIdentidad: cedula }
      });
      
      if (cedulaExistente) {
        cedula = `V-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`;
        console.log(`🔄 Cédula duplicada, usando: ${cedula}`);
      }
    } else {
      cedula = `V-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`;
    }

    // Crear el estudiante
    const estudiante = await prisma.estudiante.create({
      data: {
        nombres: data.nombres,
        apellidos: data.apellidos,
        cedulaIdentidad: cedula,
        fechaNacimiento: data.fechaNacimiento || new Date().toISOString().split('T')[0],
        edad: data.edad || '',
        sexo: data.sexo || '',
        nivel: data.nivel || '',
        grado: data.grado || '',
        seccion: data.seccion || '',
        numeroTelefonoCelular: data.numeroTelefonoCelular || '',
        correoElectronico: data.correoElectronico,
        userId: data.userId
      }
    });

    console.log(`✅ Estudiante creado: ${estudiante.nombres} ${estudiante.apellidos}`);
    console.log(`📌 userId: "${estudiante.userId}"`);
    
    return NextResponse.json(estudiante, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear estudiante:", error);
    return NextResponse.json(
      { error: "Error al crear estudiante", details: (error as Error).message },
      { status: 500 }
    );
  }
}