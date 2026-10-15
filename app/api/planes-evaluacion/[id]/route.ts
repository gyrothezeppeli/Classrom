import { NextRequest } from 'next/server';
import { planesEvaluacionIdService } from '@/lib/services/planes-evaluacion-id-service'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return planesEvaluacionIdService.GET(request, { params });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return planesEvaluacionIdService.PUT(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return planesEvaluacionIdService.DELETE(request, { params });
}

