import { NextRequest } from 'next/server';
import { asistenciaEstudiantesService } from '@/lib/services/asistencia-estudiantes-service'

export async function GET(request: NextRequest) {
  return asistenciaEstudiantesService.GET(request);
}
export const runtime = 'nodejs';
