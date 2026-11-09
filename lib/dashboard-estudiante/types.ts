export interface FilaPlan {
  id: string;
  fecha: string;
  referenteTeorico: string;
  estrategiaEvaluacion: string;
  tecnicaEvaluacion: string;
  instrumentoEvaluacion: string;
  ptos: string;
  porcentaje: string;
  criteriosEvaluacion: string;
}

export interface PlanEvaluacion {
  id: string;
  areaFormacion: string;
  docente: string;
  docenteId: string;
  ano: string;
  secciones: string;
  nivel: string;
  grado: string;
  materia: string;
  filas: FilaPlan[];
  visto: boolean;
  fechaVisto: string | null;
  createdAt: string;
}

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  estado: string;
  recursos: string;
  objetivos: string;
  ponderacion: string;
  materia: string;
  docente: string;
  nivel: string;
  grado: string;
  seccion: string;
  visto: boolean;
  entregado: boolean;
  calificacion: number | null;
  createdAt: string;
}

export interface Aviso {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  materia: string;
  docente: string;
  nivel: string;
  grado: string;
  seccion: string;
  visto: boolean;
  fechaVisto: string | null;
  createdAt: string;
}

export interface Material {
  id: string;
  titulo: string;
  descripcion: string;
  enlace: string;
  fecha: string;
  materia: string;
  docente: string;
  nivel: string;
  grado: string;
  seccion: string;
  visto: boolean;
  fechaVisto: string | null;
  createdAt: string;
}

export type PlanApi = Omit<Partial<PlanEvaluacion>, 'filas'> & {
  titulo?: string;
  seccion?: string;
  filas?: Array<Omit<Partial<FilaPlan>, 'criteriosEvaluacion'> & {
    fecha?: string;
    criteriosEvaluacion?: string | string[];
  }>;
};
export type TareaApi = Partial<Tarea>;
export type AvisoApi = Partial<Aviso>;
export type MaterialApi = Partial<Material>;

export interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  grado: string;
  seccion: string;
  cedulaIdentidad: string;
  correoElectronico: string;
  nivel: string;
  telefono?: string;
}

export interface Horario {
  id: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  materia: string;
  docente: string;
  nivel: string;
  grado: string;
  seccion: string;
  aula: string;
  anioAcademico: string;
}

export interface MateriaConPlanes {
  id: string;
  nombre: string;
  profesor: string;
  horario: string;
  aula: string;
  color: string;
  tareasPendientes: Tarea[];
  avisos: Aviso[];
  materiales: Material[];
  planEvaluacion: PlanEvaluacion[];
}

export type FiltroMaterias = 'todas' | 'novedades' | 'tareas' | 'planes_nuevos';
