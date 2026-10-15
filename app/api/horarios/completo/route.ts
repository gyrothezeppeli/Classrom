import { NextRequest } from 'next/server';
import { horariosCompletoService } from '@/lib/services/horarios-completo-service'

export async function DELETE(request: NextRequest) {
  return horariosCompletoService.DELETE(request);
}

