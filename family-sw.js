/* 오늘 민주는 — 오프라인에서도 열리게 앱 파일을 담아 둔다.
 * 앱 파일은 새것부터 찾고, 인식기처럼 크고 바뀌지 않는 파일은 담아 둔 것을 먼저 쓴다.
 */
var VERSION = 'family-v21';
var SHELL = [
  'family.html', 'family.css', 'family.webmanifest',
  'src/routedata.js', 'src/codes.js', 'src/airports.js', 'src/geo.js', 'src/holidays-lunar.js', 'src/holidays.js',
  'src/resolve.js', 'src/verify.js',
  'src/routes.js', 'src/crewnet.js', 'src/parser.js', 'src/ocrlayout.js', 'src/ocr.js',
  'src/family/config.js', 'src/family/flightstatus.js', 'src/family/flighttime.js', 'src/family/sample.js', 'src/family/bus.js', 'src/family/travel-data.js',
  'src/family/plan.js', 'src/family/sync.js', 'src/family/main.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(VERSION).then(function (cache) { return cache.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);

  if (url.pathname.indexOf('/vendor/') >= 0 || url.hostname.indexOf('gstatic') >= 0) {
    event.respondWith(caches.match(request).then(function (hit) {
      return hit || fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(VERSION).then(function (cache) { cache.put(request, copy); });
        return response;
      });
    }));
    return;
  }

  if (url.origin !== location.origin) return;
  event.respondWith(fetch(request).then(function (response) {
    var copy = response.clone();
    caches.open(VERSION).then(function (cache) { cache.put(request, copy); });
    return response;
  }).catch(function () {
    return caches.match(request).then(function (hit) { return hit || caches.match('family.html'); });
  }));
});
