import { NextRequest } from 'next/server';
import { avisosService } from '@/lib/services/avisos-service'

export async function GET(request: NextRequest) {
  return avisosService.GET(request);
}

export async function POST(request: NextRequest) {
  return avisosService.POST(request);
}
export const runtime = 'nodejs';
