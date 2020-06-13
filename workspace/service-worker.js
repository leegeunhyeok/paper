const VERSION = 'v2';

self.addEventListener('install', (event) => {
  console.log('Service Worker - install');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker - activate');
});

self.addEventListener('fetch', (event) => {
  console.log('Service Worker -', event.request.url);

  // .jpg 확장자 파일을 요청할 경우 모두 강아지 사진으로 바꿔 응답하기
  if (event.request.url.endsWith('.jpg')) {
    console.log('멍멍!');
    event.respondWith(fetch('/upload/puppy.jpg'));
  }
});