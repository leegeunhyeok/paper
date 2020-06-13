const VERSION = 'v5';
const CACHE_NAME = 'paper-cache_' + VERSION;
const IMAGE_CACHE_NAME = 'paper-image_' + VERSION;

const IMMUTABLE_APPSHELL = [
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/manifest.json',
  '/images/no_image.png',
  '/images/add_photo.svg',
  '/images/clear.svg',
  '/images/delete.svg',
  '/images/favorite_active.svg',
  '/images/favorite.svg',
  '/images/menu.svg',
  '/images/notification.svg',
  '/images/notification_disabled.svg',
  '/images/notification_enabled.svg'
];

const MUTABLE_APPSHELL = [
  '/',
  '/login',
  '/js/app.js',
  '/js/util.js',
  '/js/common.js',
  '/js/axios.min.js',
  '/js/index.js',
  '/js/login.js',
  '/js/paper-store.js',
  '/css/index.css',
  '/css/login.css'
];

const CACHE_LIST = IMMUTABLE_APPSHELL.concat(MUTABLE_APPSHELL);
const DYNAMIC_PATTERN = /(\.eot$|\.ttf$|\.woff$|^\/icons)/;

self.addEventListener('install', (event) => {
  console.log('Service Worker - install');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_LIST);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker - activate');

  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME && key !== IMAGE_CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

self.addEventListener('fetch', (event) => {
  console.log('Service Worker -', event.request.url);
  const url = new URL(event.request.url);

  // 자주 변경되지 않는 리소스인 경우
  if (IMMUTABLE_APPSHELL.includes(url.pathname)) {
    // 캐시 우선, 후 네트워크 응답
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  } else if (MUTABLE_APPSHELL.includes(url.pathname)) {
    // 자주 변경되는 리소스인 경우
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(() => {
          // 네트워크 문제가 발생한 경우 캐시에서 응답
          return cache.match(event.request);
        });
      })
    );
  } else if (
    url.pathname.startsWith('/upload') ||
    DYNAMIC_PATTERN.test(url.pathname)
  ) {
    const TARGET_CACHE = url.pathname.startsWith('/upload') ?
      IMAGE_CACHE_NAME : CACHE_NAME;

    event.respondWith(
      caches.open(TARGET_CACHE).then((cache) => {
        return cache.match(event.request).then((cacheResponse) => {
          // 캐시가 존재하는 경우 캐시 응답
          if (cacheResponse) {
            return cacheResponse;
          } else {
            // 존재하지 않는 경우 최초 1회만 캐싱
            return fetch(event.request).then((networkResponse) => {
              // 캐싱하고 네트워크 리소스 응답
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
        });
      })
    );
  }
});