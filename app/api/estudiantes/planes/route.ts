import { NextRequest } from 'next/server';
import { estudiantesPlanesService } from '@/lib/services/estudiantes-planes-service'

export async function GET(request: NextRequest) {
  return estudiantesPlanesService.GET(request);
}

