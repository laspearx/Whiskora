self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'Whiskora', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Whiskora', {
      body: data.body || '',
      icon: data.icon || '/mini-logo.png',
      badge: '/mini-logo.png',
      tag: data.tag || 'whiskora-reminder',
      data: { url: data.url || '/profile' },
      requireInteraction: false,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/profile';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
