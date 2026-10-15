import { docentesService } from '@/lib/services/docentes-service'

export async function GET(req: Request) {
  return docentesService.GET(req);
}

export async function POST(req: Request) {
  return docentesService.POST(req);
}

export async function PUT(req: Request) {
  return docentesService.PUT(req);
}

export async function DELETE(req: Request) {
  return docentesService.DELETE(req);
}

