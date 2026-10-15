import { EvaluationPlan, type EvaluationPlanData } from '@/lib/domain/evaluation/EvaluationPlan';

export type ClassroomContentType = 'tarea' | 'aviso' | 'material' | 'guia' | 'plan';

export interface ClassroomItem {
  id: number;
}

export interface ClassroomTask extends ClassroomItem {
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  materia: string;
  completado: boolean;
}

export interface ClassroomNotice extends ClassroomItem {
  titulo: string;
  descripcion: string;
  fecha: string;
}

export interface ClassroomMaterial extends ClassroomItem {
  titulo: string;
  descripcion: string;
  enlace: string;
}

export interface ClassroomGuide extends ClassroomItem {
  titulo: string;
  descripcion: string;
  archivo: string;
}

export interface ClassroomPlan extends ClassroomItem, EvaluationPlanData {}

const STORAGE_PREFIX: Record<ClassroomContentType, string> = {
  tarea: 'tareas',
  aviso: 'avisos',
  material: 'materiales',
  guia: 'guias',
  plan: 'plan',
};

export class ClassroomContentService {
  load<T extends ClassroomItem>(type: ClassroomContentType, classKey: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const serialized = window.localStorage.getItem(this.storageKey(type, classKey));
      const items: unknown = serialized ? JSON.parse(serialized) : [];
      return Array.isArray(items) ? items as T[] : [];
    } catch {
      return [];
    }
  }

  save<T extends ClassroomItem>(type: ClassroomContentType, classKey: string, items: T[]): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(this.storageKey(type, classKey), JSON.stringify(items));
  }

  add<T extends ClassroomItem>(
    items: T[],
    data: Omit<T, 'id'>,
  ): Array<Omit<T, 'id'> & Pick<ClassroomItem, 'id'>> {
    return [...items, { ...data, id: Date.now() }];
  }

  toggleTask<T extends ClassroomItem & { completado: boolean }>(items: T[], id: number): T[] {
    return items.map((item) => item.id === id
      ? { ...item, completado: !item.completado }
      : item);
  }

  remove<T extends ClassroomItem>(items: T[], id: number): T[] {
    return items.filter((item) => item.id !== id);
  }

  createPlan(data: { periodo: string; contenido: string; fecha: string }): EvaluationPlan | null {
    return EvaluationPlan.canCreate(data.periodo) ? new EvaluationPlan(data) : null;
  }

  private storageKey(type: ClassroomContentType, classKey: string): string {
    return `${STORAGE_PREFIX[type]}_${classKey}`;
  }
}
