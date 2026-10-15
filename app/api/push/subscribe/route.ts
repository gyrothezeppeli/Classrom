import { NextRequest } from 'next/server';
import { pushSubscribeService } from '@/lib/services/push-subscribe-service'

export async function POST(request: NextRequest) {
  return pushSubscribeService.POST(request);
}

export async function DELETE(request: NextRequest) {
  return pushSubscribeService.DELETE(request);
}

