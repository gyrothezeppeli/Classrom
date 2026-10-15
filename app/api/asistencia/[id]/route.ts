import { NextRequest } from 'next/server';
import { asistenciaIdService } from '@/lib/services/asistencia-id-service'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return asistenciaIdService.DELETE(request, { params });
}
export const runtime = 'nodejs';
