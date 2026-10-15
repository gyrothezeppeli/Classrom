import { NextRequest } from 'next/server';
import { notasDocentesExportarService } from '@/lib/services/notas-docentes-exportar-service'

export async function GET(req: NextRequest) {
  return notasDocentesExportarService.GET(req);
}

