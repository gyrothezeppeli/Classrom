import { NextRequest } from 'next/server';
import { asistenciaService } from '@/lib/services/asistencia-service'

export async function GET(request: NextRequest) {
  return asistenciaService.GET(request);
}

export async function POST(request: NextRequest) {
  return asistenciaService.POST(request);
}
export const runtime = 'nodejs';
