export class ScheduleSlot {
  constructor(
    readonly day: string,
    readonly start: string,
    readonly end: string,
  ) {
    if (!day.trim()) {
      throw new TypeError('El día del horario es obligatorio');
    }
    if (ScheduleSlot.toMinutes(end) <= ScheduleSlot.toMinutes(start)) {
      throw new RangeError('La hora de fin debe ser posterior a la hora de inicio');
    }
  }

  overlaps(other: ScheduleSlot): boolean {
    return this.day === other.day
      && ScheduleSlot.toMinutes(this.start) < ScheduleSlot.toMinutes(other.end)
      && ScheduleSlot.toMinutes(other.start) < ScheduleSlot.toMinutes(this.end);
  }

  static toMinutes(time: string): number {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      throw new TypeError(`Hora inválida: ${time}`);
    }
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  static endAfterHours(start: string, duration: number): string {
    const startMinutes = ScheduleSlot.toMinutes(start);
    if (!Number.isInteger(duration) || duration <= 0) {
      throw new RangeError('La duración debe ser un entero positivo');
    }
    const [hours, minutes] = [Math.floor(startMinutes / 60), startMinutes % 60];
    const end = hours + duration;
    if (end > 23) {
      throw new RangeError('El horario no puede terminar después de las 23:59');
    }
    return `${String(end).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}
