import { NextRequest } from 'next/server';
import { tareasIdService } from '@/lib/services/tareas-id-service'

export async function GET(request: NextRequest) {
  return tareasIdService.GET(request);
}

export async function POST(request: NextRequest) {
  return tareasIdService.POST(request);
}

