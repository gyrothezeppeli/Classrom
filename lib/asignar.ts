// lib/asignar.ts

import { prisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import { schoolCourseMatcher } from './coincidencias';

type ModeloAsignacion = 'tarea' | 'aviso' | 'material' | 'planEvaluacion';

export class StudentAssignmentService {
  constructor(private readonly database: PrismaClient = prisma) {}

  async assignToStudents(
    model: ModeloAsignacion,
    entityId: string,
    level: string,
    grade: string,
    section: string
  ): Promise<number> {
    const students = await this.database.estudiante.findMany();
    const matchingStudents = students.filter(
      (student) =>
        schoolCourseMatcher.matchesLevel(level, student.nivel) &&
        schoolCourseMatcher.matchesGrade(grade, student.grado) &&
        schoolCourseMatcher.matchesSection(section, student.seccion)
    );

    if (matchingStudents.length === 0) return 0;

    switch (model) {
      case 'tarea':
        await this.database.estudianteTarea.createMany({
          data: matchingStudents.map((student) => ({
            estudianteId: student.id,
            tareaId: entityId,
            visto: false,
            entregado: false,
          })),
          skipDuplicates: true,
        });
        break;
      case 'aviso':
        await this.database.estudianteAviso.createMany({
          data: matchingStudents.map((student) => ({
            estudianteId: student.id,
            avisoId: entityId,
            visto: false,
          })),
          skipDuplicates: true,
        });
        break;
      case 'material':
        await this.database.estudianteMaterial.createMany({
          data: matchingStudents.map((student) => ({
            estudianteId: student.id,
            materialId: entityId,
            visto: false,
          })),
          skipDuplicates: true,
        });
        break;
      case 'planEvaluacion':
        await this.database.estudiantePlanEvaluacion.createMany({
          data: matchingStudents.map((student) => ({
            estudianteId: student.id,
            planEvaluacionId: entityId,
            visto: false,
          })),
          skipDuplicates: true,
        });
        break;
    }

    return matchingStudents.length;
  }
}

export const studentAssignmentService = new StudentAssignmentService();

export const asignarAEstudiantes = (
  modelo: ModeloAsignacion,
  entidadId: string,
  nivel: string,
  grado: string,
  seccion: string
): Promise<number> =>
  studentAssignmentService.assignToStudents(modelo, entidadId, nivel, grado, seccion);