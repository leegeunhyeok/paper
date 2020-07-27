importScripts('/js/paper-store.js');

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

self.addEventListener('sync', (event) => {
  console.log('Service Worker - sync:', event.tag);

  if (event.tag.includes('job-')) {
    const paperDB = new PaperStore();
    const user = event.tag.split('-').pop();

    event.waitUntil(
      // user의 대기 중인 작업 조회
      paperDB.getJobs(user).then((jobs) => {
        return Promise.all(jobs.map((job) => {
          const action = job.action;
          console.log('Service Worker - job:', action);

          // 업로드 작업
          if (action === 'upload') {
            // 폼 데이터
            const formData = new FormData();
            formData.append('title', job.title);
            formData.append('content', job.content);
            formData.append('image', job.image);

            // 서버로 요청 보내기
            return fetch('/api/posts', {
              method: 'POST',
              headers: {
                'X-Paper-User': encodeURI(job.user)
              },
              body: formData
            }).then(() => {
              return paperDB.deleteJob(job.id);
            });
          } else if (action === 'delete') {
            return fetch('/api/posts/' + job.postId, {
              method: 'DELETE',
              headers: {
                'X-Paper-User': encodeURI(job.user)
              }
            }).then(() => {
              return paperDB.deleteJob(job.id);
            });
          } else if (action === 'update') {
            return fetch('/api/posts/' + job.postId, {
              method: 'PUT',
              headers: {
                'X-Paper-User': encodeURI(job.user),
                // JSON 데이터에 맞게 컨텐츠 타입 지정
                'Content-Type': 'application/json'
              },
              // 본문
              body: JSON.stringify({
                state: job.state // 작업 데이터에 저장되어있던 좋아요 상태
              })
            }).then(() => {
              return paperDB.deleteJob(job.id);
            });
          }
        })).then(() => {
          // 모든 작업 완료
          console.log('Service Worker - Job finished!');

          // 작업이 모두 완료되었을 때, 모든 클라이언트에게 메시지 보내기
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage('job-finished');
            });
          });
        });
      })
    );
  }
});

self.addEventListener('message', (event) => {
  const { action, payload } = event.data;
  const port = event.ports[0]; // 포트 배열의 첫 번째 요소
  console.log('Service Worker - message:', action);

  if (action === 'sync-image') {
    event.waitUntil(
      // 이미지 캐시 열기
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        // 모든 캐시 목록 조회
        return cache.keys().then((keys) => {
          // 캐시된 리소스의 URL을 추출하고,
          // 실제 게시물 이미지에 포함되지 않은 리소스만 필터링
          const deleteList = keys
            .map((request) => new URL(request.url).pathname)
            .filter((image) => !payload.includes(image));

          // 필터링된 이미지 캐시 제거
          return Promise.all(deleteList.map((image) => {
            return cache.delete(image).then((done) => {
              console.log('Service Worker - Sync image', image, done);
            });
          })).then(() => {
            port.postMessage('Image sync - completed');
          });
        });
      })
    );
  }
});

self.addEventListener('push', (event) => {
  const data = event.data.json();
  console.log('Service Worker - push:', data);

  const title = 'Paper';
  const options = {
    body: data.message,
    badge: data.badge,
    icon: data.icon
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker - Notification clicked!');
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow('https://google.com')
  );
});
