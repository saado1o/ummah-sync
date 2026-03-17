// ummah-sync Service Worker  handles background push notifications
// Placed in /public/ so Vite serves it at root scope

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim());
});

// Handle push events from the Push API (server-sent push)
self.addEventListener('push', (e) => {
    let data = { title: 'ummah-sync', body: 'You have a new notification' };
    try { data = e.data.json(); } catch (_) { }
    e.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/vite.svg',
            badge: '/vite.svg',
            vibrate: [200, 100, 200],
            tag: data.tag || 'ummah-sync-notification',
            renotify: true,
            data: data,
        })
    );
});

// Handle notification click  focus the app window
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});

// Listen for messages from the main thread (used for in-app  SW notification relay)
self.addEventListener('message', (e) => {
    if (e.data?.type === 'SHOW_NOTIFICATION') {
        const { title, body, tag, vibrate } = e.data;
        self.registration.showNotification(title, {
            body,
            icon: '/vite.svg',
            badge: '/vite.svg',
            vibrate: vibrate || [200, 100, 200],
            tag: tag || 'ummah-sync',
            renotify: true,
        });
    }
});
