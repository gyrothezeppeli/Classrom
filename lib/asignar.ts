// lib/asignar.ts

import { prisma } from '@/lib/prisma';
import { coincideNivel, coincideGrado, coincideSeccion } from './coincidencias';

type ModeloAsignacion = 'tarea' | 'aviso' | 'material' | 'planEvaluacion';

export async function asignarAEstudiantes(
  modelo: ModeloAsignacion,
  entidadId: string,
  nivel: string,
  grado: string,
  seccion: string
): Promise<number> {
  const estudiantes = await prisma.estudiante.findMany();

  const coincidentes = estudiantes.filter(
    (est) =>
      coincideNivel(nivel, est.nivel) &&
      coincideGrado(grado, est.grado) &&
      coincideSeccion(seccion, est.seccion)
  );

  if (coincidentes.length === 0) {
    return 0;
  }

  switch (modelo) {
    case 'tarea':
      await prisma.estudianteTarea.createMany({
        data: coincidentes.map((est) => ({
          estudianteId: est.id,
          tareaId: entidadId,
          visto: false,
          entregado: false,
        })),
        skipDuplicates: true,
      });
      break;

    case 'aviso':
      await prisma.estudianteAviso.createMany({
        data: coincidentes.map((est) => ({
          estudianteId: est.id,
          avisoId: entidadId,
          visto: false,
        })),
        skipDuplicates: true,
      });
      break;

    case 'material':
      await prisma.estudianteMaterial.createMany({
        data: coincidentes.map((est) => ({
          estudianteId: est.id,
          materialId: entidadId,
          visto: false,
        })),
        skipDuplicates: true,
      });
      break;

    case 'planEvaluacion':
      await prisma.estudiantePlanEvaluacion.createMany({
        data: coincidentes.map((est) => ({
          estudianteId: est.id,
          planEvaluacionId: entidadId,
          visto: false,
        })),
        skipDuplicates: true,
      });
      break;
  }

  return coincidentes.length;
}