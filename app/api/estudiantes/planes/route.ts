// app/api/estudiantes/planes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener planes de evaluación ASIGNADOS a un estudiante
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estudianteId = searchParams.get('estudianteId');

    if (!estudianteId) {
      return NextResponse.json(
        { error: 'ID de estudiante requerido' },
        { status: 400 }
      );
    }

    // ✅ 1. Verificar que el estudiante existe
    const estudiante = await prisma.estudiante.findUnique({
      where: { id: estudianteId },
      select: { id: true, nivel: true, grado: true, seccion: true },
    });

    if (!estudiante) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      );
    }

    // ✅ 2. Consultar la tabla intermedia (fuente de verdad)
    const asignaciones = await prisma.estudiantePlanEvaluacion.findMany({
      where: { estudianteId },
      include: {
        planEvaluacion: {
          include: {
            docente: {
              include: {
                user: {
                  select: { nombre: true, apellido: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        planEvaluacion: { createdAt: 'desc' },
      },
    });

    console.log(`📊 ${asignaciones.length} planes asignados al estudiante ${estudianteId}`);

    // ✅ 3. Formatear la respuesta con la estructura que espera el dashboard
    const planesFormateados = asignaciones.map((a) => {
      const plan = a.planEvaluacion;

      // Adaptar las filas: la BD guarda fechaInicio/fechaFin pero el dashboard espera "fecha"
      const filasAdaptadas = Array.isArray(plan.filas)
        ? (plan.filas as any[]).map((f: any) => ({
            id: f.id || `fila-${Math.random()}`,
            // ✅ Convertir fechaInicio/fechaFin a un solo string
            fecha: f.fechaInicio && f.fechaFin
              ? `${f.fechaInicio} al ${f.fechaFin}`
              : f.fechaInicio || f.fechaFin || f.fecha || '',
            referenteTeorico: f.referenteTeorico || '',
            estrategiaEvaluacion: f.estrategiaEvaluacion || '',
            tecnicaEvaluacion: f.tecnicaEvaluacion || '',
            instrumentoEvaluacion: f.instrumentoEvaluacion || '',
            ptos: f.ptos || '',
            porcentaje: f.porcentaje || '',
            // ✅ Convertir array de criterios a string
            criteriosEvaluacion: Array.isArray(f.criteriosEvaluacion)
              ? f.criteriosEvaluacion.filter(Boolean).join(', ')
              : (f.criteriosEvaluacion || ''),
          }))
        : [];

      return {
        id: plan.id,
        asignacionId: a.id,
        areaFormacion: plan.titulo || 'Sin título',
        titulo: plan.titulo,
        descripcion: plan.descripcion,
        nivel: plan.nivel,
        grado: plan.grado,
        seccion: plan.seccion,
        secciones: plan.seccion,
        materia: plan.materia,
        docente: plan.docente
          ? `${plan.docente.user.nombre} ${plan.docente.user.apellido || ''}`.trim()
          : 'Docente no asignado',
        docenteId: plan.docenteId,
        filas: filasAdaptadas,
        visto: a.visto,
        fechaVisto: a.fechaVisto,
        calificacion: a.calificacion,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(planesFormateados);
  } catch (error) {
    console.error('Error al obtener planes del estudiante:', error);
    return NextResponse.json(
      { error: 'Error al obtener planes' },
      { status: 500 }
    );
  }
}