import { NextRequest } from 'next/server';
import { asistenciaReporteService } from '@/lib/services/asistencia-reporte-service'

export async function GET(request: NextRequest) {
  return asistenciaReporteService.GET(request);
}
export const runtime = 'nodejs';
