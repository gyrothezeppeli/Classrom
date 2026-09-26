// lib/push.ts
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

// ✅ Configurar VAPID al cargar el módulo
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface NotificacionPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Envía una notificación push a un estudiante específico.
 */
export async function enviarNotificacionAEstudiante(
  estudianteId: string,
  payload: NotificacionPayload
): Promise<{ exitosas: number; fallidas: number }> {
  const suscripciones = await prisma.pushSubscription.findMany({
    where: { estudianteId },
  });

  let exitosas = 0;
  let fallidas = 0;

  for (const sub of suscripciones) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      );
      exitosas++;
    } catch (error: any) {
      fallidas++;
      // ✅ Si la suscripción ya no es válida, eliminarla
      if (error?.statusCode === 410 || error?.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        console.error(`Error enviando push a ${estudianteId}:`, error?.message);
      }
    }
  }

  return { exitosas, fallidas };
}

/**
 * Envía una notificación push a MÚLTIPLES estudiantes en paralelo.
 * Útil para notificar a un curso completo cuando se crea una tarea.
 */
export async function enviarNotificacionAEstudiantes(
  estudianteIds: string[],
  payload: NotificacionPayload
): Promise<{ total: number; exitosas: number; fallidas: number }> {
  if (estudianteIds.length === 0) {
    return { total: 0, exitosas: 0, fallidas: 0 };
  }

  // ✅ Buscar todas las suscripciones en una sola query
  const suscripciones = await prisma.pushSubscription.findMany({
    where: { estudianteId: { in: estudianteIds } },
  });

  let exitosas = 0;
  let fallidas = 0;

  // ✅ Enviar en lotes de 50 para no saturar
  const BATCH_SIZE = 50;
  for (let i = 0; i < suscripciones.length; i += BATCH_SIZE) {
    const lote = suscripciones.slice(i, i + BATCH_SIZE);

    const resultados = await Promise.allSettled(
      lote.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        )
      )
    );

    resultados.forEach((resultado, index) => {
      if (resultado.status === 'fulfilled') {
        exitosas++;
      } else {
        fallidas++;
        const error: any = resultado.reason;
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          prisma.pushSubscription
            .delete({ where: { id: lote[index].id } })
            .catch(() => {});
        }
      }
    });
  }

  return {
    total: suscripciones.length,
    exitosas,
    fallidas,
  };
}