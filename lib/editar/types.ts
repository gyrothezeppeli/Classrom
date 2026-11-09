export interface FilaPlan {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  referenteTeorico: string;
  estrategiaEvaluacion: string;
  tecnicaEvaluacion: string;
  instrumentoEvaluacion: string;
  ptos: string;
  porcentaje: string;
  criteriosEvaluacion: string[];
}

export interface PlanEvaluacion {
  id: string;
  areaFormacion: string;
  docente: string;
  docenteId?: string;
  ano: string;
  secciones: string;
  filas: FilaPlan[];
  nivel: string;
  grado: string;
  materia: string;
  createdAt?: string;
  seccion?: string;
}

export type PlanApi = Omit<Partial<PlanEvaluacion>, 'filas'> & {
  titulo?: string;
  filas?: Array<Partial<FilaPlan> & { fecha?: string }>;
};

export interface DocenteInfo {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  especialidad?: string;
  user?: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

export interface Estudiante {
  id: string;
  nombres: string;
  apellidos: string;
  cedulaIdentidad: string;
  fechaNacimiento?: string;
  nivel: string;
  grado: string;
  seccion: string;
  numeroTelefonoCelular?: string;
  correoElectronico?: string;
}
