import { NextRequest } from 'next/server';
import { horariosIdService } from '@/lib/services/horarios-id-service'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return horariosIdService.PUT(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return horariosIdService.DELETE(request, { params });
}

