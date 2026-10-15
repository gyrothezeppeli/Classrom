import { salonesSincronizarService } from '@/lib/services/salones-sincronizar-service'

export async function POST() {
  return salonesSincronizarService.POST();
}

