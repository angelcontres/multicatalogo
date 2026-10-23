// src/serviceWorkerRegistration.ts
// Registro seguro y resiliente del Service Worker para capacidades PWA y Offline

export function registerServiceWorker() {
  if (
    'serviceWorker' in navigator &&
    (window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registrado exitosamente con ámbito:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[PWA] Nueva versión disponible; se aplicará al recargar.');
                } else {
                  console.log('[PWA] Contenido cacheado para navegación offline.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn('[PWA] Fallo en registro de Service Worker:', error);
        });
    });
  }
}
