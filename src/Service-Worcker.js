// 1. DEFINICIÓN DE LA CACHÉ
// Nombramos nuestra bóveda de almacenamiento. Al cambiar el "v1" a "v2", 
// obligamos al navegador a actualizar los archivos cuando haya una nueva versión.
const CACHE_NAME = 'tinkerlog-cache-v1';

// Definimos un arreglo con las rutas de los archivos esenciales (HTML, CSS, JS, imágenes)
// que queremos guardar en el dispositivo del usuario para que la app abra sin internet.
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/assets/icons/icon-192x192.png'
];

// 2. FASE DE INSTALACIÓN
// El evento 'install' se dispara la primera vez que el navegador detecta este archivo JS.
self.addEventListener('install', event => {
  // event.waitUntil asegura que el Service Worker no se considere "instalado" 
  // hasta que todo el código dentro de esta promesa termine de ejecutarse.
  event.waitUntil(
    // Abrimos (o creamos) la memoria caché con el nombre definido arriba.
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caché abierta correctamente');
        // Descargamos y guardamos todos los archivos del arreglo 'urlsToCache'.
        return cache.addAll(urlsToCache);
      })
  );
});

// 3. FASE DE ACTIVACIÓN
// El evento 'activate' ocurre después de la instalación. Es ideal para limpiar cachés viejas.
self.addEventListener('activate', event => {
  // Lista de cachés permitidas (solo la versión actual).
  const cacheAllowlist = [CACHE_NAME];

  event.waitUntil(
    // Revisamos todas las cachés guardadas en el dispositivo del usuario.
    caches.keys().then(cacheNames => {
      // Usamos Promise.all para esperar a que termine el proceso de revisión.
      return Promise.all(
        cacheNames.map(cacheName => {
          // Si encontramos una caché vieja (ej. v0) que no está en nuestra lista blanca...
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            // ...la eliminamos para liberar espacio en el teléfono del usuario.
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 4. FASE DE FETCH (INTERCEPTACIÓN DE RED)
// El evento 'fetch' se dispara cada vez que la app intenta descargar algo (una foto, un PDF, un dato).
self.addEventListener('fetch', event => {
  // Respondemos a la petición del navegador interceptándola.
  event.respondWith(
    // Buscamos si la petición (ej. la imagen del DAC) ya existe en nuestra memoria caché.
    caches.match(event.request)
      .then(response => {
        // Si la encontramos en la caché, la devolvemos inmediatamente (¡Funciona offline!).
        if (response) {
          return response;
        }
        // Si no está en la caché, dejamos que la petición continúe hacia Internet de forma normal.
        return fetch(event.request);
      })
  );
});