import { NextRequest } from 'next/server';
import { notasDocentesService } from '@/lib/services/notas-docentes-service'

export async function GET(req: NextRequest) {
  return notasDocentesService.GET(req);
}

