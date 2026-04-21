var CACHE_NAME = 'strokesight-lite-v3';
var ASSETS = [
  './', './index.html', './styles.css', './config.js', './audio.js', './app.js',
  './exercises/anchor.js', './exercises/reading.js', './exercises/flicker.js',
  './exercises/grid.js', './exercises/pursuit.js', './exercises/bisection.js',
  './exercises/tracker.js', './exercises/gapfill.js',
  './strings/en.js', './strings/es.js', './strings/fr.js', './strings/de.js',
  './strings/it.js', './strings/pt.js', './strings/cy.js', './strings/ja.js',
  './strings/ko.js', './strings/hi.js', './strings/ar.js', './strings/zh.js',
  './strings/pl.js', './strings/es_mx.js', './strings/pt_br.js', './strings/fr_ca.js',
  './manifest.json',
  './icons/icon-192x192.png', './icons/icon-512x512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      return self.clients.matchAll({ type: 'window' }).then(function(clients) {
        clients.forEach(function(client) { client.postMessage({ type: 'SW_UPDATED' }); });
      });
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, response.clone());
          return response;
        });
      });
    }).catch(function() {
      return caches.match('./index.html');
    })
  );
});
