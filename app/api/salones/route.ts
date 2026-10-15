import { NextRequest } from 'next/server';
import { salonesService } from '@/lib/services/salones-service'

export async function GET() {
  return salonesService.GET();
}

export async function POST(request: NextRequest) {
  return salonesService.POST(request);
}

