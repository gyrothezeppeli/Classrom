import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

export class PushSubscribeService {
  constructor(private readonly prismaClient: typeof prisma = prisma) {}


  async POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: 'Suscripción inválida' },
        { status: 400 }
      );
    }

    const estudiante = await this.prismaClient.estudiante.findUnique({
      where: { userId: session.user.id },
    });

    if (!estudiante) {
      return NextResponse.json(
        { error: 'Solo los estudiantes pueden suscribirse a notificaciones' },
        { status: 403 }
      );
    }

    await this.prismaClient.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        estudianteId: estudiante.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: request.headers.get('user-agent') || null,
      },
      create: {
        estudianteId: estudiante.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Error al guardar suscripción:', error);
    return NextResponse.json(
      { error: 'Error al guardar la suscripción' },
      { status: 500 }
    );
  }
}

  async DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({ error: 'Falta endpoint' }, { status: 400 });
    }

    await this.prismaClient.pushSubscription.deleteMany({ where: { endpoint } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error al eliminar suscripción:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la suscripción' },
      { status: 500 }
    );
  }
}

}

export const pushSubscribeService = new PushSubscribeService();