export class ScheduleSlot {
  constructor(
    readonly day: string,
    readonly start: string,
    readonly end: string,
  ) {}

  overlaps(other: ScheduleSlot): boolean {
    return this.day === other.day
      && ScheduleSlot.toMinutes(this.start) < ScheduleSlot.toMinutes(other.end)
      && ScheduleSlot.toMinutes(other.start) < ScheduleSlot.toMinutes(this.end);
  }

  static toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  static endAfterHours(start: string, duration: number): string {
    const [hours, minutes] = start.split(':').map(Number);
    const end = hours + duration;
    return `${String(end).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}
