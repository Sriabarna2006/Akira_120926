// AKIRA Intelligence & Mobile Notification Service Worker
const CACHE_NAME = 'akira-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 🔔 Handle Incoming Web Push Notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'AKIRA • Intelligence Alert',
    body: 'New real-world intelligence update is available.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'akira-general',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = {
        title: parsed.title || data.title,
        body: parsed.body || data.body,
        icon: parsed.icon || data.icon,
        badge: parsed.badge || data.badge,
        tag: parsed.tag || data.tag,
        data: parsed.data || { url: parsed.url || '/' },
      };
    } catch (e) {
      // If payload is plain text
      const text = event.data.text();
      if (text) {
        data.body = text;
      }
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    renotify: true,
    data: data.data,
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open in AKIRA' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// 👆 Handle Notification Clicks and Deep-Linking
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.url || '/';

  // Sanitize deep link URL (ensure same origin or relative path)
  if (!targetUrl.startsWith('/') && !targetUrl.startsWith(self.location.origin)) {
    targetUrl = '/';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window with the target URL
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 🌐 Safe Fetch Interceptor (Phase 17 Service Worker Safety)
// NEVER cache or intercept /api/*, /health, or non-GET requests as static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Completely bypass dynamic API and server routes to network
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/health') ||
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin
  ) {
    return; // Standard network fetch
  }

  // 2. Network-first strategy for navigation and static assets
  event.respondWith(
    fetch(event.request).catch(() => {
      // Offline fallback for HTML navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html').then((cached) => cached || Response.error());
      }
      return Response.error();
    })
  );
});


