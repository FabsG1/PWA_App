/* ==========================================================================
 * ThinkerLog · Service Worker
 * --------------------------------------------------------------------------
 * Estrategias:
 *  - App Shell (precache):      páginas base, manifest, íconos y offline.html
 *  - Navegación (HTML):         Network First  -> caché -> offline.html
 *  - JS / CSS:                  Network First  -> caché  (siempre código fresco)
 *  - Imágenes / fuentes:        Cache First    -> red    (rápido y offline)
 *
 * Cambia VERSION cada vez que publiques para forzar la actualización.
 * ========================================================================== */

const VERSION = 'v3.0.0';
const STATIC_CACHE = `thinkerlog-static-${VERSION}`;
const RUNTIME_CACHE = `thinkerlog-runtime-${VERSION}`;
const OFFLINE_URL = '/offline.html';

/** Archivos imprescindibles: si alguno falla, la instalación falla. */
const CRITICAL_ASSETS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

/** Archivos deseables: se intentan cachear, pero no bloquean la instalación. */
const OPTIONAL_ASSETS = ['/', '/foro', '/nueva-publicacion'];

const log = (...args) =>
  console.log('%c[SW ' + VERSION + ']', 'color:#58a6ff;font-weight:bold', ...args);

/* ------------------------------ INSTALL --------------------------------- */
self.addEventListener('install', (event) => {
  log('Instalando…');
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(CRITICAL_ASSETS);
      await Promise.allSettled(
        OPTIONAL_ASSETS.map(async (url) => {
          const response = await fetch(url, { cache: 'reload' });
          if (response.ok && !response.redirected) await cache.put(url, response);
        }),
      );
      log('App Shell en caché:', [...CRITICAL_ASSETS, ...OPTIONAL_ASSETS]);
    })(),
  );
  // No hacemos skipWaiting() automático: la app muestra un aviso
  // "Nueva versión disponible" y el usuario decide cuándo actualizar.
});

/* ------------------------------ ACTIVATE -------------------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('thinkerlog-') && ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => {
            log('Eliminando caché antigua:', key);
            return caches.delete(key);
          }),
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
      log('Activo y controlando la app ✅');
    })(),
  );
});

/* ------------------------------ MESSAGES -------------------------------- */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    log('Actualización aceptada por el usuario');
    self.skipWaiting();
  }
  if (event.data?.type === 'GET_VERSION') {
    event.source?.postMessage({ type: 'VERSION', version: VERSION });
  }
});

/* ------------------------------ FETCH ----------------------------------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo GET del mismo origen. Ignora el tráfico del dev-server (Vite / HMR).
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/@') || url.pathname.includes('ng-cli-ws') || url.pathname.includes('/node_modules/')) return;

  // 1) Navegación entre páginas
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(event));
    return;
  }

  // 2) Imágenes y fuentes
  if (['image', 'font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 3) Scripts, estilos, manifest y demás
  event.respondWith(networkFirst(request));
});

/* ------------------------------ ESTRATEGIAS ----------------------------- */
async function networkFirstPage(event) {
  try {
    const preload = await event.preloadResponse;
    const response = preload || (await fetch(event.request));
    putInCache(RUNTIME_CACHE, event.request, response.clone());
    return response;
  } catch {
    log('Sin conexión, sirviendo desde caché:', event.request.url);
    return (
      (await caches.match(event.request, { ignoreSearch: true })) ||
      (await caches.match('/foro')) ||
      (await caches.match(OFFLINE_URL))
    );
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    putInCache(RUNTIME_CACHE, request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    putInCache(RUNTIME_CACHE, request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

async function putInCache(cacheName, request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic' || response.redirected) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
}
