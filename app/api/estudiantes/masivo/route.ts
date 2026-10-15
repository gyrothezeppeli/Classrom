import { estudiantesMasivoService } from '@/lib/services/estudiantes-masivo-service'

export async function PUT(request: Request) {
  return estudiantesMasivoService.PUT(request);
}
