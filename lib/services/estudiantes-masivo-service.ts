import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import { coincideNivel, coincideGrado, coincideSeccion } from '@/lib/coincidencias';

export class EstudiantesMasivoService {
  constructor(private readonly prismaClient: typeof prisma = prisma) {}


  async PUT(request: Request) {
  try {
    const body = await request.json();
    const { actualizaciones } = body;

    // Validación básica
    if (!actualizaciones || !Array.isArray(actualizaciones) || actualizaciones.length === 0) {
      return NextResponse.json(
        { error: 'Formato de datos inválido. Se espera un array de actualizaciones.' },
        { status: 400 }
      );
    }

    // Validar que cada actualización tenga un ID
    for (const act of actualizaciones) {
      if (!act.id) {
        return NextResponse.json(
          { error: 'Cada actualización debe tener un ID de estudiante' },
          { status: 400 }
        );
      }
    }

    const resultados = [];
    const [planes, tareas, avisos, materiales] = await Promise.all([
      this.prismaClient.planEvaluacion.findMany({
        select: { id: true, nivel: true, grado: true, seccion: true }
      }),
      this.prismaClient.tarea.findMany({
        select: { id: true, nivel: true, grado: true, seccion: true }
      }),
      this.prismaClient.aviso.findMany({
        select: { id: true, nivel: true, grado: true, seccion: true }
      }),
      this.prismaClient.material.findMany({
        select: { id: true, nivel: true, grado: true, seccion: true }
      })
    ]);

    // Procesamos cada estudiante uno por uno para manejar la lógica de reasignación
    for (const act of actualizaciones) {
      const { id, nivel, grado, seccion } = act;

      // 1. Obtener el estudiante actual con sus datos
      const estudianteActual = await this.prismaClient.estudiante.findUnique({
        where: { id },
        include: {
          user: {
            select: { nombre: true, apellido: true }
          }
        }
      });

      if (!estudianteActual) {
        console.warn(`Estudiante con ID ${id} no encontrado, saltando...`);
        continue;
      }

      // Determinar el nuevo curso (usar el actual si no se especifica)
      const nuevoNivel = nivel || estudianteActual.nivel;
      const nuevoGrado = grado || estudianteActual.grado;
      const nuevaSeccion = seccion || estudianteActual.seccion;

      // Si no hay cambios reales, saltamos
      if (
        nuevoNivel === estudianteActual.nivel &&
        nuevoGrado === estudianteActual.grado &&
        nuevaSeccion === estudianteActual.seccion
      ) {
        continue;
      }

      console.log(`🔄 Actualizando estudiante ${estudianteActual.user.nombre} ${estudianteActual.user.apellido}`);
      console.log(`   Curso anterior: ${estudianteActual.nivel} ${estudianteActual.grado} ${estudianteActual.seccion}`);
      console.log(`   Curso nuevo:    ${nuevoNivel} ${nuevoGrado} ${nuevaSeccion}`);

      // 2. Buscar o crear el Salón correspondiente al nuevo curso
      let salon = await this.prismaClient.salon.findFirst({
        where: {
          nivel: nuevoNivel,
          grado: nuevoGrado,
          seccion: nuevaSeccion,
          anioAcademico: "2024-2025"
        }
      });

      if (!salon) {
        // Crear el salón si no existe
        salon = await this.prismaClient.salon.create({
          data: {
            nombre: `${nuevoGrado} ${nuevaSeccion}`,
            nivel: nuevoNivel,
            grado: nuevoGrado,
            seccion: nuevaSeccion,
            anioAcademico: "2024-2025"
          }
        });
        console.log(`   → Salón creado: ${salon.nombre}`);
      }

      const planesFiltrados = planes.filter(p =>
        coincideNivel(p.nivel, nuevoNivel) &&
        coincideGrado(p.grado, nuevoGrado) &&
        coincideSeccion(p.seccion, nuevaSeccion)
      );
      const tareasFiltradas = tareas.filter(t =>
        coincideNivel(t.nivel, nuevoNivel) &&
        coincideGrado(t.grado, nuevoGrado) &&
        coincideSeccion(t.seccion, nuevaSeccion)
      );
      const avisosFiltrados = avisos.filter(a =>
        coincideNivel(a.nivel, nuevoNivel) &&
        coincideGrado(a.grado, nuevoGrado) &&
        coincideSeccion(a.seccion, nuevaSeccion)
      );
      const materialesFiltrados = materiales.filter(m =>
        coincideNivel(m.nivel, nuevoNivel) &&
        coincideGrado(m.grado, nuevoGrado) &&
        coincideSeccion(m.seccion, nuevaSeccion)
      );

      // 3. Ejecutar toda la actualización en una transacción
      await this.prismaClient.$transaction(async (tx) => {
        // 3.1 Actualizar el estudiante (incluyendo salonId)
        await tx.estudiante.update({
          where: { id },
          data: {
            nivel: nuevoNivel,
            grado: nuevoGrado,
            seccion: nuevaSeccion,
            salonId: salon.id
          }
        });

        // 3.2 Eliminar asignaciones que no corresponden al nuevo curso.
        // Las que siguen vigentes se conservan para no perder su estado.
        await tx.estudiantePlanEvaluacion.deleteMany({
          where: {
            estudianteId: id,
            ...(planesFiltrados.length > 0
              ? { planEvaluacionId: { notIn: planesFiltrados.map(({ id: planId }) => planId) } }
              : {})
          }
        });
        await tx.estudianteTarea.deleteMany({
          where: {
            estudianteId: id,
            ...(tareasFiltradas.length > 0
              ? { tareaId: { notIn: tareasFiltradas.map(({ id: tareaId }) => tareaId) } }
              : {})
          }
        });
        await tx.estudianteAviso.deleteMany({
          where: {
            estudianteId: id,
            ...(avisosFiltrados.length > 0
              ? { avisoId: { notIn: avisosFiltrados.map(({ id: avisoId }) => avisoId) } }
              : {})
          }
        });
        await tx.estudianteMaterial.deleteMany({
          where: {
            estudianteId: id,
            ...(materialesFiltrados.length > 0
              ? { materialId: { notIn: materialesFiltrados.map(({ id: materialId }) => materialId) } }
              : {})
          }
        });

        // 3.3 Crear solo las asignaciones que todavía no existen
        if (planesFiltrados.length > 0) {
          await tx.estudiantePlanEvaluacion.createMany({
            data: planesFiltrados.map(p => ({
              estudianteId: id,
              planEvaluacionId: p.id,
              visto: false
            })),
            skipDuplicates: true
          });
        }

        if (tareasFiltradas.length > 0) {
          await tx.estudianteTarea.createMany({
            data: tareasFiltradas.map(t => ({
              estudianteId: id,
              tareaId: t.id,
              visto: false,
              entregado: false
            })),
            skipDuplicates: true
          });
        }

        if (avisosFiltrados.length > 0) {
          await tx.estudianteAviso.createMany({
            data: avisosFiltrados.map(a => ({
              estudianteId: id,
              avisoId: a.id,
              visto: false
            })),
            skipDuplicates: true
          });
        }

        if (materialesFiltrados.length > 0) {
          await tx.estudianteMaterial.createMany({
            data: materialesFiltrados.map(m => ({
              estudianteId: id,
              materialId: m.id,
              visto: false
            })),
            skipDuplicates: true
          });
        }

        console.log(`   → Reasignado: ${planesFiltrados.length} planes, ${tareasFiltradas.length} tareas, ${avisosFiltrados.length} avisos, ${materialesFiltrados.length} materiales`);
      });

      resultados.push({
        id,
        nombre: estudianteActual.user.nombre,
        apellido: estudianteActual.user.apellido,
        cursoAnterior: `${estudianteActual.nivel} ${estudianteActual.grado} ${estudianteActual.seccion}`,
        cursoNuevo: `${nuevoNivel} ${nuevoGrado} ${nuevaSeccion}`
      });
    }

    return NextResponse.json({
      success: true,
      message: `${resultados.length} estudiantes actualizados correctamente`,
      actualizados: resultados.length,
      detalles: resultados
    });

  } catch (error) {
    console.error('❌ Error en actualización masiva:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor al actualizar estudiantes',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

}

export const estudiantesMasivoService = new EstudiantesMasivoService();