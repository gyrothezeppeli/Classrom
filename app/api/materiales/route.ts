import { NextRequest } from 'next/server';
import { materialesService } from '@/lib/services/materiales-service'

export async function GET(request: NextRequest) {
  return materialesService.GET(request);
}

export async function POST(request: NextRequest) {
  return materialesService.POST(request);
}

