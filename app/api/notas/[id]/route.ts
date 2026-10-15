import { NextRequest } from 'next/server';
import { notasIdService } from '@/lib/services/notas-id-service'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return notasIdService.DELETE(req, { params });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return notasIdService.PUT(req, { params });
}

