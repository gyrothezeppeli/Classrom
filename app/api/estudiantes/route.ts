import { NextRequest } from 'next/server';
import { estudiantesService } from '@/lib/services/estudiantes-service'

export async function GET() {
  return estudiantesService.GET();
}

export async function POST(req: NextRequest) {
  return estudiantesService.POST(req);
}
