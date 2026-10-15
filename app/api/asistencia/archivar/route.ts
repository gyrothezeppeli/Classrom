import { NextRequest } from 'next/server';
import { asistenciaArchivarService } from '@/lib/services/asistencia-archivar-service'

export async function POST(request: NextRequest) {
  return asistenciaArchivarService.POST(request);
}

export async function GET(request: NextRequest) {
  return asistenciaArchivarService.GET(request);
}
export const runtime = 'nodejs';
