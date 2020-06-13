// @ch4. 서비스 워커 등록
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then((registration) => {
    // 업데이트 발견
    registration.addEventListener('updatefound', () => {
      // 설치 중인 새로운 서비스 워커
      const newServiceWorker = registration.installing;
      console.log('PAPER: New update found!');

      newServiceWorker.addEventListener('statechange', (event) => {
        const state = event.target.state;
        console.log('PAPER: ' + state);
        if (state === 'installed') {
          util.message('앱을 재시작하면 업데이트가 적용됩니다!');
        }
      });
    });
  });
}

// window.onload
$(function () {
  util.updateTheme();

  // 온/오프라인 상태에 따라 알림 표시/숨기기
  function updateOnlineState () {
    // @ch5. 온/오프라인 상태 알림 표시기능 구현
    util.showOfflineAlert(!navigator.onLine);
  }

  // @ch5. 온/오프라인 상태 감지 이벤트 등록
  window.addEventListener('online', updateOnlineState);
  window.addEventListener('offline', updateOnlineState);
  updateOnlineState();
});
