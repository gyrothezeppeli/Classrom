import { NextRequest } from 'next/server';
import { estudiantesTareasService } from '@/lib/services/estudiantes-tareas-service'

export async function GET(request: NextRequest) {
  return estudiantesTareasService.GET(request);
}

export async function POST(request: NextRequest) {
  return estudiantesTareasService.POST(request);
}

