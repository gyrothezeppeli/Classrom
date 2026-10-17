// lib/asignar.ts

import { prisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import { schoolCourseMatcher } from './coincidencias';

type ModeloAsignacion = 'tarea' | 'aviso' | 'material' | 'planEvaluacion';

export interface StudentClass {
  id: string;
  nivel: string;
  grado: string;
  seccion: string;
}

export interface StudentContentAssignmentSummary {
  planes: number;
  tareas: number;
  avisos: number;
  materiales: number;
}

export class StudentAssignmentService {
  constructor(private readonly database: PrismaClient = prisma) {}

  async assignExistingContent(student: StudentClass): Promise<StudentContentAssignmentSummary> {
    const [plans, tasks, notices, materials] = await Promise.all([
      this.database.planEvaluacion.findMany({
        select: { id: true, nivel: true, grado: true, seccion: true },
      }),
      this.database.tarea.findMany({
        select: { id: true, nivel: true, grado: true, seccion: true },
      }),
      this.database.aviso.findMany({
        select: { id: true, nivel: true, grado: true, seccion: true },
      }),
      this.database.material.findMany({
        select: { id: true, nivel: true, grado: true, seccion: true },
      }),
    ]);
    const matchingPlans = plans.filter((plan) => this.matchesClass(plan, student));
    const matchingTasks = tasks.filter((task) => this.matchesClass(task, student));
    const matchingNotices = notices.filter((notice) => this.matchesClass(notice, student));
    const matchingMaterials = materials.filter((material) => this.matchesClass(material, student));

    await this.database.$transaction(async (tx) => {
      await Promise.all([
        matchingPlans.length > 0
          ? tx.estudiantePlanEvaluacion.createMany({
            data: matchingPlans.map((plan) => ({
              estudianteId: student.id,
              planEvaluacionId: plan.id,
              visto: false,
            })),
            skipDuplicates: true,
          })
          : Promise.resolve(null),
        matchingTasks.length > 0
          ? tx.estudianteTarea.createMany({
            data: matchingTasks.map((task) => ({
              estudianteId: student.id,
              tareaId: task.id,
              visto: false,
              entregado: false,
            })),
            skipDuplicates: true,
          })
          : Promise.resolve(null),
        matchingNotices.length > 0
          ? tx.estudianteAviso.createMany({
            data: matchingNotices.map((notice) => ({
              estudianteId: student.id,
              avisoId: notice.id,
              visto: false,
            })),
            skipDuplicates: true,
          })
          : Promise.resolve(null),
        matchingMaterials.length > 0
          ? tx.estudianteMaterial.createMany({
            data: matchingMaterials.map((material) => ({
              estudianteId: student.id,
              materialId: material.id,
              visto: false,
            })),
            skipDuplicates: true,
          })
          : Promise.resolve(null),
      ]);
    });

    return {
      planes: matchingPlans.length,
      tareas: matchingTasks.length,
      avisos: matchingNotices.length,
      materiales: matchingMaterials.length,
    };
  }

  async assignToStudents(
    model: ModeloAsignacion,
    entityId: string,
    level: string,
    grade: string,
    section: string
  ): Promise<number> {
    const students = await this.database.estudiante.findMany({
      select: { id: true, nivel: true, grado: true, seccion: true },
    });
    const matchingStudents = students.filter(
      (student) => this.matchesClass(
        { nivel: level, grado: grade, seccion: section },
        student,
      )
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

  private matchesClass(
    first: Pick<StudentClass, 'nivel' | 'grado' | 'seccion'>,
    second: Pick<StudentClass, 'nivel' | 'grado' | 'seccion'>,
  ): boolean {
    return schoolCourseMatcher.matchesLevel(first.nivel, second.nivel)
      && schoolCourseMatcher.matchesGrade(first.grado, second.grado)
      && schoolCourseMatcher.matchesSection(first.seccion, second.seccion);
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