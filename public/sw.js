// ============================================================================
// EnvioTrack — Service Worker (PWA)
// ============================================================================

const CACHE_NAME = 'enviotrack-v1';
const STATIC_ASSETS = [
  '/',
  '/new',
  '/settings',
  '/trash',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Instalar: cachear los recursos estáticos principales de forma segura
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Intentamos cachear cada asset individualmente para que no falle todo si uno no existe
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (error) {
          console.warn('No se pudo cachear:', asset);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activar: limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network-first strategy (intenta la red, si falla usa el cache)
self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, guardarla en cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
  );
});

// Mensajes desde el cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
