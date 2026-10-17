export interface GradeSummary {
  average: number | string;
  passing: number;
  failing: number;
  total: number;
}

export class Grade {
  static readonly minimum = 0;
  static readonly maximum = 20;
  static readonly passingMark = 10;

  readonly value: number;

  constructor(value: number) {
    if (!Grade.isValid(value)) {
      throw new RangeError(`La nota debe estar entre ${Grade.minimum} y ${Grade.maximum}`);
    }
    this.value = value;
  }

  get isPassing(): boolean {
    return this.value >= Grade.passingMark;
  }

  static parse(value: string | number): number {
    return typeof value === 'number' ? value : parseFloat(value.replace(',', '.'));
  }

  static isValid(value: string | number): boolean {
    const parsed = Grade.parse(value);
    return Number.isFinite(parsed) && parsed >= Grade.minimum && parsed <= Grade.maximum;
  }

  static isPassing(value: string | number): boolean {
    return Grade.parse(value) >= Grade.passingMark;
  }

  static average(values: number[]): number | null {
    const validValues = values.filter((value) => Number.isFinite(value));
    return validValues.length === 0
      ? null
      : validValues.reduce((total, value) => total + value, 0) / validValues.length;
  }

  static summarize(values: Array<string | number>, emptyAverage: number | string = 0): GradeSummary {
    const validValues = values
      .map(Grade.parse)
      .filter((value) => Number.isFinite(value));

    if (validValues.length === 0) {
      return { average: emptyAverage, passing: 0, failing: 0, total: 0 };
    }

    const average = Grade.average(validValues) ?? 0;
    return {
      average: average.toFixed(2),
      passing: validValues.filter((value) => Grade.isPassing(value)).length,
      failing: validValues.filter((value) => !Grade.isPassing(value)).length,
      total: validValues.length,
    };
  }
}
