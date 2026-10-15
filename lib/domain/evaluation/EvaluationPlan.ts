export interface EvaluationPlanData {
  periodo: string;
  contenido: string;
  fecha: string;
}

export class EvaluationPlan implements EvaluationPlanData {
  readonly periodo: string;
  readonly contenido: string;
  readonly fecha: string;

  constructor(data: EvaluationPlanData) {
    this.periodo = data.periodo;
    this.contenido = data.contenido;
    this.fecha = data.fecha;
  }

  get displayPeriod(): string {
    return this.periodo.trim();
  }

  static canCreate(periodo: string): boolean {
    return Boolean(periodo);
  }
}
