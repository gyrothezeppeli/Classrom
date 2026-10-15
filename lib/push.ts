// lib/push.ts
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';

// ============================================
// ✅ Configuración tolerante a fallos de VAPID
// ============================================
const VAPID_CONFIGURADO = Boolean(
  process.env.VAPID_SUBJECT &&
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
);

if (VAPID_CONFIGURADO) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    console.log('✅ VAPID configurado. Notificaciones push habilitadas.');
  } catch (error) {
    console.warn('⚠️ Error al configurar VAPID:', error);
  }
} else {
  console.warn(
    '⚠️ VAPID no configurado. Notificaciones push deshabilitadas.\n' +
    '   Agrega VAPID_SUBJECT, VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY al .env para habilitarlas.'
  );
}

interface NotificacionPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

function getPushErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode;
  }
}

function getPushErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return String(error);
}

/**
 * Envía una notificación push a un estudiante específico.
 */
export class PushNotificationService {
  constructor(
    private readonly database: PrismaClient = prisma,
    private readonly pushClient = webpush,
    private readonly vapidConfigured = VAPID_CONFIGURADO
  ) {}

  async enviarNotificacionAEstudiante(
    estudianteId: string,
    payload: NotificacionPayload
  ): Promise<{ exitosas: number; fallidas: number }> {
  // ✅ Si VAPID no está configurado, salir sin error
  if (!this.vapidConfigured) {
    return { exitosas: 0, fallidas: 0 };
  }

  const suscripciones = await this.database.pushSubscription.findMany({
    where: { estudianteId },
  });

  let exitosas = 0;
  let fallidas = 0;

  for (const sub of suscripciones) {
    try {
      await this.pushClient.sendNotification(
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
    } catch (error: unknown) {
      fallidas++;
      // ✅ Si la suscripción ya no es válida, eliminarla
      const statusCode = getPushErrorStatus(error);
      if (statusCode === 410 || statusCode === 404) {
        try {
          await this.database.pushSubscription.delete({ where: { id: sub.id } });
        } catch (deleteError) {
          console.error(`Error eliminando suscripción inválida ${sub.id}:`, deleteError);
        }
      } else {
        console.error(`Error enviando push a ${estudianteId}:`, getPushErrorMessage(error));
      }
    }
  }

  return { exitosas, fallidas };
  }

/**
 * Envía una notificación push a MÚLTIPLES estudiantes en paralelo.
 * Útil para notificar a un curso completo cuando se crea una tarea.
 */
  async enviarNotificacionAEstudiantes(
    estudianteIds: string[],
    payload: NotificacionPayload
  ): Promise<{ total: number; exitosas: number; fallidas: number }> {
  if (estudianteIds.length === 0) {
    return { total: 0, exitosas: 0, fallidas: 0 };
  }

  // ✅ Si VAPID no está configurado, salir sin error
  if (!this.vapidConfigured) {
    return { total: 0, exitosas: 0, fallidas: 0 };
  }

  // ✅ Buscar todas las suscripciones en una sola query
  const suscripciones = await this.database.pushSubscription.findMany({
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
        this.pushClient.sendNotification(
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
        const error = resultado.reason;
        const statusCode = getPushErrorStatus(error);
        if (statusCode === 410 || statusCode === 404) {
          this.database.pushSubscription
            .delete({ where: { id: lote[index].id } })
            .catch((deleteError) => {
              console.error(
                `Error eliminando suscripción inválida ${lote[index].id}:`,
                deleteError
              );
            });
        } else {
          console.error('Error enviando notificación push:', getPushErrorMessage(error));
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
}

export const pushNotificationService = new PushNotificationService();

export const enviarNotificacionAEstudiante = (
  estudianteId: string,
  payload: NotificacionPayload
): Promise<{ exitosas: number; fallidas: number }> =>
  pushNotificationService.enviarNotificacionAEstudiante(estudianteId, payload);

export const enviarNotificacionAEstudiantes = (
  estudianteIds: string[],
  payload: NotificacionPayload
): Promise<{ total: number; exitosas: number; fallidas: number }> =>
  pushNotificationService.enviarNotificacionAEstudiantes(estudianteIds, payload);