import { NextRequest } from 'next/server';
import { estudiantesUsuarioUserIdService } from '@/lib/services/estudiantes-usuario-user-id-service'

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  return estudiantesUsuarioUserIdService.GET(request, { params });
}

