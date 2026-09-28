// public/sw.js
// ============================================
// Service Worker para notificaciones push
// ============================================

self.addEventListener('install', (event) => {
  console.log('[SW] Instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activado');
  event.waitUntil(self.clients.claim());
});

// ✅ Escuchar notificaciones push
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido');

  let data = {
    title: 'Nueva notificación',
    body: 'Tienes una novedad en el portal',
    icon: '/assets/img/pc2.jpeg',
    badge: '/assets/img/pc2.jpeg',
    url: '/dashboard/estudiante',
    tag: 'general',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error('[SW] Error parseando payload:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: { url: data.url },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ✅ Manejar click en la notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Click en notificación');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard/estudiante';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});