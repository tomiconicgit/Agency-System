/*
  Agency - Service Worker (sw.js)
  
  This file enables Progressive Web App (PWA) features for the "Agency" terminal.
  It manages caching of core assets, allowing the application to work offline
  and to be installed on a user's device.
*/

const CACHE_NAME = 'agency-terminal-v1';

// List of all the files to be cached on install.
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'css/style.css',
  'js/app.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&family=Roboto:wght@400;700&display=swap',
  // Fictional sound files
  'sounds/click.mp3',
  'sounds/login-success.mp3',
  'sounds/login-fail.mp3',
  'sounds/notification.mp3',
  'sounds/alert-critical.mp3',
  'sounds/typing.mp3',
  'sounds/deploy-success.mp3',
  'sounds/mission-complete.mp3',
  // PWA icons
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
];

// --- Install Event ---
self.addEventListener('install', event => {
  // Perform install steps
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching essential assets...');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// --- Activate Event ---
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    // Delete any old caches to save space
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// --- Fetch Event (Offline-First Strategy) ---
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If the request is in the cache, return it
        if (response) {
          return response;
        }

        // If not, fetch from the network
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // If it's a valid response, clone it and add it to the cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
