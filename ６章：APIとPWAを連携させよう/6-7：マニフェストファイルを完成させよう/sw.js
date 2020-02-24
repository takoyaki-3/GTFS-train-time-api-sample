// キャッシュ名とキャッシュするファイルの指定
var CACHE_NAME = 'simple-pwa-caches';
var urlsToCache = [
  './css/style.css',
  './page1.html',
  './page2.html',
  './images/loading.gif'
];
// インストール処理
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});
// リソースフェッチ時のロード処理
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response ? response : fetch(event.request);
    })
  );
});