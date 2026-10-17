import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type StudentWithName = Prisma.EstudianteGetPayload<{
  include: { user: { select: { nombre: true; apellido: true } } };
}>;
type TeacherWithName = Prisma.DocenteGetPayload<{
  include: { user: { select: { nombre: true; apellido: true } } };
}>;

export interface AsistenciaEstudianteRecord {
  estudianteId: string;
  asistio: boolean;
  estudiante?: StudentWithName;
}

export interface AsistenciaRecord {
  id: string;
  fecha: Date;
  nivel: string;
  grado: string;
  seccion: string;
  materia: string;
  hora: string | null;
  observaciones: string | null;
  docenteId: string;
  createdAt: Date;
  docente?: TeacherWithName;
  estudiantes?: AsistenciaEstudianteRecord[];
  _count?: { estudiantes: number };
}

export interface AsistenciaWhere {
  fecha?: { gte?: Date; lt?: Date; lte?: Date };
  nivel?: string;
  grado?: string;
  seccion?: string;
  materia?: string;
  docenteId?: string;
}

export interface AsistenciaEstudianteCreate {
  estudianteId: string;
  asistio: boolean;
}

export interface AsistenciaCreateData {
  fecha: Date;
  nivel: string;
  grado: string;
  seccion: string;
  materia: string;
  docenteId: string;
  hora: string | null;
  observaciones: string | null;
  estudiantes: { create: AsistenciaEstudianteCreate[] };
}

export type AsistenciaUpdateData = Prisma.AsistenciaUncheckedUpdateInput;

interface AsistenciaInclude {
  docente?: { include: { user: { select: { nombre: true; apellido: true } } } };
  estudiantes?: true | {
    select?: { estudianteId: true; asistio: true };
    include?: {
      estudiante?: {
        include: { user: { select: { nombre: true; apellido: true } } };
      };
    };
  };
  _count?: { select: { estudiantes: true } };
}

interface AsistenciaPrismaClient {
  asistencia: {
    findMany(args: {
      where: AsistenciaWhere;
      include?: AsistenciaInclude;
      orderBy?: { fecha: 'asc' | 'desc' };
    }): Promise<AsistenciaRecord[]>;
    findFirst(args: {
      where: AsistenciaWhere;
      include: { estudiantes: true };
    }): Promise<AsistenciaRecord | null>;
    create(args: {
      data: AsistenciaCreateData;
      include: { estudiantes: true };
    }): Promise<AsistenciaRecord>;
    update(args: {
      where: { id: string };
      data: AsistenciaUpdateData;
      include: { estudiantes: true };
    }): Promise<AsistenciaRecord>;
    delete(args: { where: { id: string } }): Promise<AsistenciaRecord>;
    deleteMany(args: { where: AsistenciaWhere }): Promise<{ count: number }>;
    count(args: { where: AsistenciaWhere }): Promise<number>;
  };
  asistenciaEstudiante: {
    count(args: { where: { asistencia: { fecha: { lte: Date } } } }): Promise<number>;
    deleteMany(args: { where: { asistenciaId: string } }): Promise<{ count: number }>;
  };
}

export const asistenciaPrisma = prisma as unknown as AsistenciaPrismaClient;
