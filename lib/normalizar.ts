const MAPA_GRADOS: Record<string, string> = {
  '1': '1',
  '1ro': '1',
  '1ero': '1',
  '1er': '1',
  '1ra': '1',
  primero: '1',
  primer: '1',
  '1°': '1',
  '2': '2',
  '2do': '2',
  '2da': '2',
  '2°': '2',
  segundo: '2',
  '3': '3',
  '3ro': '3',
  '3ero': '3',
  '3ra': '3',
  '3°': '3',
  tercero: '3',
  '4': '4',
  '4to': '4',
  '4ta': '4',
  '4°': '4',
  cuarto: '4',
  '5': '5',
  '5to': '5',
  '5ta': '5',
  '5°': '5',
  quinto: '5',
  '6': '6',
  '6to': '6',
  '6ta': '6',
  '6°': '6',
  sexto: '6',
};

const GRADES_BY_LEVEL: Record<string, string[]> = {
  inicial: ['Pre-Kinder', 'Kinder', 'Preparatorio'],
  primaria: ['1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado'],
  media: ['1er Año', '2do Año', '3er Año', '4to Año', '5to Año'],
};

const ORDINALES: Record<number, string> = {
  1: '1er',
  2: '2do',
  3: '3er',
  4: '4to',
  5: '5to',
  6: '6to',
};

export class SchoolCatalog {
  readonly gradesByLevel = GRADES_BY_LEVEL;
  readonly validSections = ['A', 'B', 'C', 'D', 'E'];
  readonly validLevels = ['inicial', 'primaria', 'media'];

  normalizeGrade(grade: string, level: string): string {
    if (!grade) return '';

    const normalizedLevel = level?.toLowerCase().trim() || '';
    const cleanGrade = grade.trim();
    const validGrades = this.gradesByLevel[normalizedLevel] || [];
    if (validGrades.includes(cleanGrade)) return cleanGrade;

    const match = cleanGrade.match(/\d/);
    const number = match ? match[0] : this.findNumber(cleanGrade);
    if (!number) return cleanGrade;

    const ordinal = ORDINALES[parseInt(number, 10)];
    if (!ordinal) return cleanGrade;
    const suffix = normalizedLevel === 'primaria' ? 'Grado' : 'Año';
    return `${ordinal} ${suffix}`;
  }

  isGradeValid(grade: string, level: string): boolean {
    const normalizedLevel = level?.toLowerCase();
    return (this.gradesByLevel[normalizedLevel] || []).includes(grade);
  }

  private findNumber(grade: string): string | null {
    const normalized = grade
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    for (const [key, value] of Object.entries(MAPA_GRADOS)) {
      if (normalized === key || normalized.startsWith(key)) return value;
    }
    return null;
  }
}

export const schoolCatalog = new SchoolCatalog();
export const GRADOS_POR_NIVEL = schoolCatalog.gradesByLevel;
export const SECCIONES_VALIDAS = schoolCatalog.validSections;
export const NIVELES_VALIDOS = schoolCatalog.validLevels;

export const normalizarGrado = (grado: string, nivel: string): string =>
  schoolCatalog.normalizeGrade(grado, nivel);

export const esGradoValido = (grado: string, nivel: string): boolean =>
  schoolCatalog.isGradeValid(grado, nivel);
