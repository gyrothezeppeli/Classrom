// app/api/salones/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Listar todos los salones
export async function GET() {
  try {
    const salones = await prisma.salon.findMany({
      include: {
        estudiantes: {
          include: {
            user: {
              select: {
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        },
        docentes: true   // ✅ Incluir la relación DocenteSalon para leer los docenteIds
      },
      orderBy: { nombre: 'asc' }
    });

    const salonesFormateados = salones.map((salon) => ({
      id: salon.id,
      nombre: salon.nombre,
      nivel: salon.nivel,
      grado: salon.grado,
      seccion: salon.seccion,
      // ✅ Extraer los IDs de los docentes desde la tabla intermedia
      docenteIds: salon.docentes.map(ds => ds.docenteId),
      // ✅ Extraer los IDs de los estudiantes directamente (es.id, no es.estudianteId)
      estudianteIds: salon.estudiantes.map(es => es.id),
      anioAcademico: salon.anioAcademico,
      createdAt: salon.createdAt,
      updatedAt: salon.updatedAt
    }));

    return NextResponse.json(salonesFormateados);
  } catch (error) {
    console.error('Error al obtener salones:', error);
    return NextResponse.json(
      { error: 'Error al obtener salones' },
      { status: 500 }
    );
  }
}

// POST - Crear un salón
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, nivel, grado, seccion, estudianteIds, anioAcademico } = body;

    if (!nombre || !nivel || !grado || !seccion) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre, nivel, grado, seccion' },
        { status: 400 }
      );
    }

    // ✅ Crear el salón primero (sin estudiantes)
    const salon = await prisma.salon.create({
      data: {
        nombre,
        nivel,
        grado,
        seccion,
        anioAcademico: anioAcademico || '2024-2025',
      },
    });

    // ✅ Luego asignar los estudiantes usando updateMany sobre Estudiante.salonId
    if (estudianteIds && Array.isArray(estudianteIds) && estudianteIds.length > 0) {
      await prisma.estudiante.updateMany({
        where: { id: { in: estudianteIds } },
        data: { salonId: salon.id }
      });
    }

    // ✅ Recargar el salón con sus estudiantes ya asignados
    const salonConEstudiantes = await prisma.salon.findUnique({
      where: { id: salon.id },
      include: {
        estudiantes: true,
        docentes: true
      }
    });

    return NextResponse.json({
      id: salonConEstudiantes!.id,
      nombre: salonConEstudiantes!.nombre,
      nivel: salonConEstudiantes!.nivel,
      grado: salonConEstudiantes!.grado,
      seccion: salonConEstudiantes!.seccion,
      docenteIds: salonConEstudiantes!.docentes.map(ds => ds.docenteId),
      estudianteIds: salonConEstudiantes!.estudiantes.map(es => es.id),
      anioAcademico: salonConEstudiantes!.anioAcademico,
      createdAt: salonConEstudiantes!.createdAt,
      updatedAt: salonConEstudiantes!.updatedAt
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear salón:', error);
    return NextResponse.json(
      { error: 'Error al crear el salón', details: (error as Error).message },
      { status: 500 }
    );
  }
}