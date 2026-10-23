// ==============================================================================
// MULTICATÁLOGO - SERVICE WORKER DE ALTO RENDIMIENTO (PWA & OFFLINE)
// ==============================================================================
const CACHE_NAME = 'multicatalogo-v1';
const API_CACHE = 'multicatalogo-api-v1';

// Recursos esenciales que forman el App Shell offline
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

// 1. INSTALACIÓN: Precaching del App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVACIÓN: Limpieza de versiones obsoletas de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. INTERCEPCIÓN DE PETICIONES (FETCH)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Excluir peticiones no GET o de extensiones
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // ESTRATEGIA A: Network-First con Fallback a Caché para endpoints de la API (/api/productos, /api/red)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Respuesta JSON offline si no hay caché
          return new Response(
            JSON.stringify({
              offline: true,
              message: 'Conexión a internet no disponible. Operando en modo local.',
              data: []
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 200
            }
          );
        })
    );
    return;
  }

  // ESTRATEGIA B: Cache-First con actualización de fondo (Stale-While-Revalidate) para /assets/
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => {/* Silencioso si falla red */});

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // ESTRATEGIA C: SPA Navigation Fallback para navegación de rutas React
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Fallback estándar: Cache o Red
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});
