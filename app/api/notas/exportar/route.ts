import { NextRequest } from 'next/server';
import { notasExportarService } from '@/lib/services/notas-exportar-service'

export async function GET(request: NextRequest) {
  return notasExportarService.GET(request);
}
export const runtime = 'nodejs';
