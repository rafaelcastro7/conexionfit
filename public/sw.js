// Service worker auto-desinstalable.
// Versiones previas cacheaban /index.html y servían HTML roto tras un deploy.
// Este SW se desregistra y borra todos los cachés para devolver el control al navegador.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      const regs = await self.registration.unregister();
      const clientsList = await self.clients.matchAll({ type: 'window' });
      clientsList.forEach((client) => client.navigate(client.url));
    } catch (_) {}
  })());
});
