import { NextRequest } from 'next/server';
import { salonesIdService } from '@/lib/services/salones-id-service'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return salonesIdService.PUT(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return salonesIdService.DELETE(request, { params });
}

