// app/api/docentes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const docentes = await prisma.docente.findMany({
      include: {
        user: {
          select: {
            email: true,
            nombre: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`📤 ${docentes.length} docentes encontrados`);
    return NextResponse.json(docentes);
  } catch (error) {
    console.error("❌ Error al obtener docentes:", error);
    return NextResponse.json(
      { error: "Error al obtener docentes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    console.log("📥 Datos recibidos para crear docente:", data);

    // Validar campos requeridos
    if (!data.nombres || !data.apellidos || !data.cedulaIdentidad || !data.email || !data.userId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: nombres, apellidos, cedulaIdentidad, email, userId" },
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

    // Verificar si ya tiene un docente registrado
    const existingDocente = await prisma.docente.findUnique({
      where: { userId: data.userId }
    });

    if (existingDocente) {
      console.error(`❌ Usuario ${data.userId} ya tiene docente registrado`);
      return NextResponse.json(
        { error: "Este usuario ya tiene un docente registrado" },
        { status: 400 }
      );
    }

    // Verificar si la cédula ya está registrada
    const existingCedula = await prisma.docente.findUnique({
      where: { cedulaIdentidad: data.cedulaIdentidad }
    });

    if (existingCedula) {
      console.error(`❌ Cédula ${data.cedulaIdentidad} ya registrada`);
      return NextResponse.json(
        { error: "Esta cédula ya está registrada" },
        { status: 400 }
      );
    }

    // Verificar si el email ya está registrado en Docente
    const existingEmail = await prisma.docente.findUnique({
      where: { email: data.email }
    });

    if (existingEmail) {
      console.error(`❌ Email ${data.email} ya registrado`);
      return NextResponse.json(
        { error: "Este email ya está registrado como docente" },
        { status: 400 }
      );
    }

    // Crear el docente
    const docente = await prisma.docente.create({
      data: {
        nombres: data.nombres,
        apellidos: data.apellidos,
        cedulaIdentidad: data.cedulaIdentidad,
        email: data.email,
        telefono: data.telefono || '',
        especialidad: data.especialidad || '',
        nivel: data.nivel || '',
        seccion: data.seccion || '',
        fechaContratacion: data.fechaContratacion || new Date().toISOString().split('T')[0],
        activo: data.activo !== undefined ? data.activo : true,
        userId: data.userId
      },
      include: {
        user: {
          select: {
            email: true,
            nombre: true
          }
        }
      }
    });

    console.log(`✅ Docente creado: ${docente.nombres} ${docente.apellidos} (ID: ${docente.id})`);
    return NextResponse.json(docente, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear docente:", error);
    return NextResponse.json(
      { error: "Error al crear docente: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un docente
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: "ID del docente requerido" },
        { status: 400 }
      );
    }

    const docente = await prisma.docente.update({
      where: { id: data.id },
      data: {
        nombres: data.nombres,
        apellidos: data.apellidos,
        cedulaIdentidad: data.cedulaIdentidad,
        email: data.email,
        telefono: data.telefono,
        especialidad: data.especialidad,
        nivel: data.nivel,
        seccion: data.seccion,
        fechaContratacion: data.fechaContratacion,
        activo: data.activo
      },
      include: {
        user: {
          select: {
            email: true,
            nombre: true
          }
        }
      }
    });

    console.log(`✅ Docente actualizado: ${docente.nombres} ${docente.apellidos}`);
    return NextResponse.json(docente);
  } catch (error) {
    console.error("❌ Error al actualizar docente:", error);
    return NextResponse.json(
      { error: "Error al actualizar docente" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un docente
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "ID del docente requerido" },
        { status: 400 }
      );
    }

    await prisma.docente.delete({
      where: { id }
    });

    console.log(`✅ Docente eliminado: ${id}`);
    return NextResponse.json({ message: "Docente eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar docente:", error);
    return NextResponse.json(
      { error: "Error al eliminar docente" },
      { status: 500 }
    );
  }
}