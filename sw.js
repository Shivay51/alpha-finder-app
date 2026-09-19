// Arjun's Alpha Finder -- minimal service worker so the installed app can
// still open (last-loaded version) with no signal, and so Chrome/Android
// treats this as a real installable PWA. Cache-first for the app shell,
// falls back to network for anything else.
var CACHE_NAME = 'alpha-finder-v1';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-512-maskable.png', './apple-touch-icon.png'];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.all(SHELL.map(function(url){
        return cache.add(url).catch(function(){ /* ok if one path 404s */ });
      }));
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){ return n !== CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      var fetchPromise = fetch(event.request).then(function(networkResp){
        try{
          var copy = networkResp.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }catch(e){}
        return networkResp;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
