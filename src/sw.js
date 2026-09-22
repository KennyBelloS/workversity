// Service Worker de Workversity:
//  • guarda la app para usarla sin internet (precache)
//  • recibe notificaciones push aunque la app esté cerrada
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Cualquier ruta de la app (/tareas, /horario…) devuelve el index.html guardado.
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

// La app avisa cuando la persona acepta actualizar.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// --- Notificaciones push ------------------------------------------------------
self.addEventListener('push', (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { titulo: 'Workversity', cuerpo: event.data ? event.data.text() : '' };
  }
  const titulo = datos.titulo || 'Workversity';
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.cuerpo || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: datos.etiqueta || undefined,
      data: { url: datos.url || '/' },
      vibrate: [120, 60, 120],
      requireInteraction: datos.importante === true,
      actions: [{ action: 'abrir', title: 'Abrir' }],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if ('focus' in v) {
          if ('navigate' in v) v.navigate(destino).catch(() => {});
          return v.focus();
        }
      }
      return self.clients.openWindow(destino);
    })
  );
});
