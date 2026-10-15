import { authRegisterService } from '@/lib/services/auth-register-service'

export async function POST(req: Request) {
  return authRegisterService.POST(req);
}

