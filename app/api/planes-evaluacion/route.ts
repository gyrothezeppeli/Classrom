import { NextRequest } from 'next/server';
import { planesEvaluacionService } from '@/lib/services/planes-evaluacion-service'

export async function GET(request: NextRequest) {
  return planesEvaluacionService.GET(request);
}

export async function POST(request: NextRequest) {
  return planesEvaluacionService.POST(request);
}

