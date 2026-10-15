import { NextRequest, NextResponse } from 'next/server';

import { asistenciaPrisma } from '@/lib/services/asistencia-prisma';

export class AsistenciaIdService {
  constructor(private readonly attendanceClient: typeof asistenciaPrisma = asistenciaPrisma) {}


  async DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await this.attendanceClient.asistencia.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}

}

export const asistenciaIdService = new AsistenciaIdService();