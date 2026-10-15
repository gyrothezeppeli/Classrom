import { NextRequest } from 'next/server';
import { tareasService } from '@/lib/services/tareas-service'

export async function GET(request: NextRequest) {
  return tareasService.GET(request);
}

export async function POST(request: NextRequest) {
  return tareasService.POST(request);
}
export const runtime = 'nodejs';
