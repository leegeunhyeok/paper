const onloadCallbacks = [];
window.$ = function (fn) {
  onloadCallbacks.push(fn);
};

window.onload = function () {
  util._paperMessage = document.getElementById('alert');
  util._paperMessage.addEventListener('click', () => {
    clearTimeout(util._alertTimeout);
    util._messageOpen = false;
    util._paperMessage.classList.add('hidden');
  });
  util._offlineAlert = document.getElementById('offline_alert');

  for (const f of onloadCallbacks) {
    f.call(this);
  }
};

window._supportsPassive = false;
try {
  const opts = Object.defineProperty({}, 'passive', {
    // eslint-disable-next-line getter-return
    get () {
      window._supportsPassive = true;
    }
  });
  window.addEventListener('testPassive', null, opts);
  window.removeEventListener('testPassive', null, opts);
// eslint-disable-next-line no-empty
} catch (_) {}

// 모바일 사용성 개선 (iOS 터치 기기)
document.body.addEventListener('touchstart', function () {},
  window._supportsPassive ? { passive: true } : false
);

const util = {
  // 메시지
  _paperMessage: null,
  _alertTimeout: null,
  _messageOpen: false,
  // 오프라인 알림
  _offlineAlert: null,
  /**
   * 사용자 색상 모드(라이트, 다크)를 확인하여 스타일을 반영합니다.
   */
  updateTheme () {
    if (window.matchMedia) {
      const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
      const lightMq = window.matchMedia('(prefers-color-scheme: light)');

      const _update = () => {
        document.body.removeAttribute('class');
        document.body.classList.add(
          'theme--' + (darkMq.matches ? 'dark' : 'light')
        );
      };

      darkMq.addListener(_update);
      lightMq.addListener(_update);
      _update();
    } else {
      document.body.classList.add('theme--light');
    }
  },
  /**
   * 알림을 표시합니다.
   * @param {string} message
   */
  message (message) {
    clearTimeout(util._alertTimeout);

    if (!util._paperMessage) {
      return;
    }

    if (this._messageOpen) {
      util._paperMessage.classList.add('hidden');
      util._alertTimeout = setTimeout(() => {
        this._messageOpen = false;
        util.message(message);
      }, 800);
    } else {
      util._messageOpen = true;
      util._paperMessage.textContent = message;
      util._paperMessage.classList.remove('hidden');
      util._alertTimeout = setTimeout(() => {
        util._messageOpen = false;
        util._paperMessage.classList.add('hidden');
      }, 3500);
    }
  },
  /**
   * 오프라인 알림을 지정한 값에 따라 보이거나 숨깁니다.
   * @param {boolean} show
   */
  showOfflineAlert (show) {
    if (show) {
      util._offlineAlert.classList.remove('hidden');
    } else {
      util._offlineAlert.classList.add('hidden');
    }
  },
  /**
   * 입력으로 받은 데이터를 Uint8Array 타입으로 변환합니다.
   * @param {string} base64String 변환할 문자열 값
   */
  urlB64ToUint8Array (base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
};
