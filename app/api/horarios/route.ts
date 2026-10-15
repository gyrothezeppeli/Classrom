import { NextRequest } from 'next/server';
import { horariosService } from '@/lib/services/horarios-service'

export async function GET(request: NextRequest) {
  return horariosService.GET(request);
}

export async function POST(request: NextRequest) {
  return horariosService.POST(request);
}

