// app/api/estudiantes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { coincideNivel, coincideGrado, coincideSeccion } from '@/lib/coincidencias';

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

    // ✅ 1. Crear el usuario y el estudiante en una transacción
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

    console.log(`✅ Estudiante creado: ${estudiante.user.nombre} ${estudiante.user.apellido} | ${estudiante.nivel} ${estudiante.grado} ${estudiante.seccion}`);

    // ✅ 2. Asignar planes de evaluación existentes
    const planesExistentes = await prisma.planEvaluacion.findMany();
    const planesAsignados = planesExistentes.filter((plan) =>
      coincideNivel(plan.nivel, estudiante.nivel) &&
      coincideGrado(plan.grado, estudiante.grado) &&
      coincideSeccion(plan.seccion, estudiante.seccion)
    );

    if (planesAsignados.length > 0) {
      await prisma.estudiantePlanEvaluacion.createMany({
        data: planesAsignados.map((plan) => ({
          estudianteId: estudiante.id,
          planEvaluacionId: plan.id,
          visto: false,
        })),
        skipDuplicates: true,
      });
      console.log(`   → ${planesAsignados.length} planes asignados`);
    }

    // ✅ 3. Asignar tareas existentes
    const tareasExistentes = await prisma.tarea.findMany();
    const tareasAsignadas = tareasExistentes.filter((tarea) =>
      coincideNivel(tarea.nivel, estudiante.nivel) &&
      coincideGrado(tarea.grado, estudiante.grado) &&
      coincideSeccion(tarea.seccion, estudiante.seccion)
    );

    if (tareasAsignadas.length > 0) {
      await prisma.estudianteTarea.createMany({
        data: tareasAsignadas.map((tarea) => ({
          estudianteId: estudiante.id,
          tareaId: tarea.id,
          visto: false,
          entregado: false,
        })),
        skipDuplicates: true,
      });
      console.log(`   → ${tareasAsignadas.length} tareas asignadas`);
    }

    // ✅ 4. Asignar avisos existentes
    const avisosExistentes = await prisma.aviso.findMany();
    const avisosAsignados = avisosExistentes.filter((aviso) =>
      coincideNivel(aviso.nivel, estudiante.nivel) &&
      coincideGrado(aviso.grado, estudiante.grado) &&
      coincideSeccion(aviso.seccion, estudiante.seccion)
    );

    if (avisosAsignados.length > 0) {
      await prisma.estudianteAviso.createMany({
        data: avisosAsignados.map((aviso) => ({
          estudianteId: estudiante.id,
          avisoId: aviso.id,
          visto: false,
        })),
        skipDuplicates: true,
      });
      console.log(`   → ${avisosAsignados.length} avisos asignados`);
    }

    // ✅ 5. Asignar materiales existentes
    const materialesExistentes = await prisma.material.findMany();
    const materialesAsignados = materialesExistentes.filter((material) =>
      coincideNivel(material.nivel, estudiante.nivel) &&
      coincideGrado(material.grado, estudiante.grado) &&
      coincideSeccion(material.seccion, estudiante.seccion)
    );

    if (materialesAsignados.length > 0) {
      await prisma.estudianteMaterial.createMany({
        data: materialesAsignados.map((material) => ({
          estudianteId: estudiante.id,
          materialId: material.id,
          visto: false,
        })),
        skipDuplicates: true,
      });
      console.log(`   → ${materialesAsignados.length} materiales asignados`);
    }

    console.log(`🎉 Total asignado a ${estudiante.user.nombre}: ${planesAsignados.length} planes, ${tareasAsignadas.length} tareas, ${avisosAsignados.length} avisos, ${materialesAsignados.length} materiales`);

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
        planes: planesAsignados.length,
        tareas: tareasAsignadas.length,
        avisos: avisosAsignados.length,
        materiales: materialesAsignados.length,
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