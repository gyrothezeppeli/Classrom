import { NextRequest } from 'next/server';
import { notasService } from '@/lib/services/notas-service'

export async function GET(req: NextRequest) {
  return notasService.GET(req);
}

export async function POST(req: NextRequest) {
  return notasService.POST(req);
}

