// app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ✅ Forzar runtime Node.js (necesario en Vercel)
export const runtime = 'nodejs';

// ============================================
// POST - Guardar suscripción push
// ============================================
export async function POST(request: NextRequest) {
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

    // ✅ Buscar el estudiante asociado al usuario logueado
    const estudiante = await prisma.estudiante.findUnique({
      where: { userId: session.user.id },
    });

    if (!estudiante) {
      return NextResponse.json(
        { error: 'Solo los estudiantes pueden suscribirse a notificaciones' },
        { status: 403 }
      );
    }

    // ✅ Upsert: si ya existe el endpoint, actualiza; si no, crea
    await prisma.pushSubscription.upsert({
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

// ============================================
// DELETE - Eliminar suscripción
// ============================================
export async function DELETE(request: NextRequest) {
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

    await prisma.pushSubscription.deleteMany({ where: { endpoint } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error al eliminar suscripción:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la suscripción' },
      { status: 500 }
    );
  }
}