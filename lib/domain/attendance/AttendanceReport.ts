export class AttendanceReport {
  static readonly criticalAbsenceThreshold = 25;

  constructor(readonly absencePercentage: number) {}

  get isCritical(): boolean {
    return AttendanceReport.isCritical(this.absencePercentage);
  }

  static isCritical(absencePercentage: number): boolean {
    return absencePercentage >= AttendanceReport.criticalAbsenceThreshold;
  }
}
