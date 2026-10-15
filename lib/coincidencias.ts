export class SchoolCourseMatcher {
  private normalize(value: string): string {
    if (!value) return '';
    return value
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s_]+/g, ' ');
  }

  private levelVariants(level: string): string[] {
    const normalized = this.normalize(level);
    const variants: Record<string, string[]> = {
      inicial: ['inicial', 'preescolar', 'educacion inicial'],
      primaria: ['primaria', 'educacion primaria'],
      media: ['media', 'bachillerato', 'educacion media'],
    };
    return variants[normalized] || [normalized];
  }

  matchesLevel(a: string, b: string): boolean {
    if (!a || !b) return false;
    return (
      this.levelVariants(a).includes(this.normalize(b)) ||
      this.levelVariants(b).includes(this.normalize(a))
    );
  }

  private gradeVariants(grade: string): string[] {
    const normalized = this.normalize(grade);
    if (!normalized) return [];

    const match = normalized.match(/\d+/);
    const number = match ? match[0] : null;
    const isYear = normalized.includes('ano') || normalized.includes('año');
    const isGrade = normalized.includes('grado');
    const isLevel = normalized.includes('nivel');
    const variants = new Set<string>([normalized]);

    if (number) {
      variants.add(number);
      const ordinals: Record<string, string[]> = {
        '1': ['1ro', '1er', '1ra', 'primero', 'primer'],
        '2': ['2do', '2da', 'segundo'],
        '3': ['3ro', '3ra', 'tercero'],
        '4': ['4to', '4ta', 'cuarto'],
        '5': ['5to', '5ta', 'quinto'],
        '6': ['6to', '6ta', 'sexto'],
      };

      const numberOrdinals = ordinals[number] || [];
      numberOrdinals.forEach((ordinal) => variants.add(ordinal));

      if (isYear) {
        numberOrdinals.forEach((ordinal) => variants.add(`${ordinal} ano`));
        variants.add(`${number} ano`);
        variants.add(`${number} anos`);
      }
      if (isGrade) {
        numberOrdinals.forEach((ordinal) => variants.add(`${ordinal} grado`));
        variants.add(`${number} grado`);
      }
      if (isLevel) {
        numberOrdinals.forEach((ordinal) => variants.add(`${ordinal} nivel`));
        variants.add(`${number} nivel`);
      }
    }

    return Array.from(variants);
  }

  matchesGrade(a: string, b: string): boolean {
    if (!a || !b) return false;
    const aVariants = this.gradeVariants(a);
    const bVariants = this.gradeVariants(b);
    return aVariants.some((variant) => bVariants.includes(variant));
  }

  private parseSections(value: string | string[] | null | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((section) => this.normalize(section)).filter(Boolean);
    }
    return value
      .split(',')
      .map((section) => this.normalize(section))
      .filter(Boolean);
  }

  matchesSection(a: string, b: string): boolean {
    const normalizedA = this.normalize(a);
    const normalizedB = this.normalize(b);

    if (
      normalizedA === 'unica' ||
      normalizedA === '' ||
      normalizedB === 'unica' ||
      normalizedB === ''
    ) {
      return true;
    }

    const sectionsA = this.parseSections(a);
    const sectionsB = this.parseSections(b);
    const intersects = sectionsA.some((section) => sectionsB.includes(section));
    if (intersects) return true;

    return sectionsA.some((sectionA) =>
      sectionsB.some(
        (sectionB) =>
          sectionA === `seccion ${sectionB}` ||
          `seccion ${sectionA}` === sectionB
      )
    );
  }
}

export const schoolCourseMatcher = new SchoolCourseMatcher();

export const coincideNivel = (a: string, b: string): boolean =>
  schoolCourseMatcher.matchesLevel(a, b);

export const coincideGrado = (a: string, b: string): boolean =>
  schoolCourseMatcher.matchesGrade(a, b);

export const coincideSeccion = (a: string, b: string): boolean =>
  schoolCourseMatcher.matchesSection(a, b);
