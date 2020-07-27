<div align="center">

  <img src="./icon.png" width="300">

  # Paper
  🌐 PWA Example | Paper

</div>

## 원고 오류사항

발견된 내용 오류 사항들을 정리한 링크입니다. 확실하게 검토하지 못한 점 대단히 죄송합니다 😥

- [8장] 백그라운드 동기화 return 누락, [확인하기](https://github.com/leegeunhyeok/paper/issues/3)

## 주요 기능

<img width="250" src="./pwa.png">

기본적으로 구현되어있는 주요 기능입니다.

- 게시물 조회
- 게시물 작성
- 게시물 삭제
- 게시물 좋아요 표시

실습을 진행하며 구현해나갈 주요 기능입니다.

- 설치 가능한 Paper
- 오프라인 지원
  - 오프라인 게시물 조회
  - 오프라인 게시물 작성
  - 오프라인 게시물 삭제
  - 오프라인 좋아요 표시
- 백그라운드 동기화
  - 오프라인 상태에서 수행한 작업 동기화
- 좋아요 푸시 알림
- 이 외의 다양한 부가 기능

[Paper 미리보기](./PREVIEW.md)

## 챕터

각 챕터별 구현된 코드입니다.  
실습 진행 시 참고하거나, 빠르게 진행하기 위해 제공합니다.

- 챕터 1 - 시작하기
- 챕터 2 - 실습을 위한 개발환경 준비하기
- 챕터 3 - 프로그레시브 웹 앱이 되기 위한 준비
- [챕터 4](https://github.com/leegeunhyeok/paper/tree/ch4) - PWA의 핵심, 서비스 워커
- [챕터 5](https://github.com/leegeunhyeok/paper/tree/ch5) - 오프라인을 위한 캐시 스토리지 API
- [챕터 6](https://github.com/leegeunhyeok/paper/tree/ch6) - IndexedDB 사용하기
- [챕터 7](https://github.com/leegeunhyeok/paper/tree/ch7) - 웹 앱 매니페스트 (Web App Manifest)
- [챕터 8](https://github.com/leegeunhyeok/paper/tree/ch8) - Sync, 백그라운드 동기화
- [챕터 9](https://github.com/leegeunhyeok/paper/tree/ch9) - 서비스 워커와 클라이언트간 메시지 주고받기
- [챕터 10](https://github.com/leegeunhyeok/paper/tree/ch10) - Push, 사용자에게 알림 보내기

## 프로젝트 구조

주요 코드는 아래와 같이 구성되어있으며, 실습 시 `(* 강조)`된 소스코드에 기능을 구현합니다.

```
.
├── (* app.js) : Paper 서버 메인 코드
├── config
│   └── (* default.json) : Paper 서버 설정 파일
├── package.json
├── (* push.js) : Paper 푸시 알림 전송 모듈
├── sample
│   └── (* IndexedDB.html) : IndexedDB 기초 실습 파일 
├── server
│   └── Paper 서버 코드
├── upload : 게시물 이미지 저장 경로
└── workspace
    ├── css
    │   └── CSS 파일
    ├── fonts
    │   └── 웹 폰트 파일
    ├── icons
    │   └── Paper 아이콘 (앱 아이콘, 푸시 아이콘, 뱃지 등)
    ├── images
    │   └── Paper UI 이미지
    ├── js
    │   ├── app.js : Paper 기본 기능 구현 코드
    │   ├── axios.min.js : axios 라이브러리
    │   ├── (* common.js) : Paper 공통 코드 (메인/로그인)
    │   ├── (* index.js) : Paper 메인 페이지 코드
    │   ├── login.js : Paper 로그인 페이지 코드
    │   ├── (* paper-store.js) : Paper IndexedDB 기능 코드
    │   ├── polyfill.min.js : ES6 프로미스 폴리필
    │   └── util.js : Paper 유틸 코드
    ├── (* index.html) : Paper 메인 페이지
    ├── login.html : Paper 로그인 페이지
    ├── (* manifest.json) : 웹 앱 매니페스트
    ├── (* service-worker.js) : 서비스 워커
    └── splash
        └── iOS/iPad 스플래시 이미지
```

## 코드 조각

실습 중 직접 작성해야하는 단순한 타이핑 작업을 최소화할 수 있도록 코드 조각을 제공합니다.

### 캐싱 리스트

5. 오프라인을 위한 캐시 스토리지

```javascript
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
```

```javascript
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
```

### 웹 앱 매니페스트

7. 웹 앱 매니페스트 (Web App Menifest)

```json
{
  "name": "",
  "short_name": "",
  "icons": [
    {
      "src": "",
      "sizes": "",
      "type": ""
    }
  ],
  "theme_color": "",
  "background_color": "",
  "orientation": "",
  "display": "",
  "start_url": ""
}
```

```html
<!-- Web App Manifest 추가 -->
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Paper">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="theme-color" content="#ffffff">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
```

```html
<!-- iOS/iPadOS 스플래시 이미지 -->
<link
  rel="apple-touch-startup-image"
  media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
  href="/splash/icon_828x1792.png"
/>
<link
  rel="apple-touch-startup-image"
  media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
  href="/splash/icon_1242x2688.png"
/>
<link
  rel="apple-touch-startup-image"
  media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
  href="/splash/icon_1125x2436.png"
/>
<link
  rel="apple-touch-startup-image"
  media="screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
  href="/splash/icon_1242x2208.png"
/>
<link
  rel="apple-touch-startup-image"
  media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
  href="/splash/icon_750x1334.png"
/>
<link
  rel="apple-touch-startup-image"
  media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
  href="/splash/icon_2048x2732.png"
/>
<link
  rel="apple-touch-startup-image"
  media="screen and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
  href="/splash/icon_1668x2224.png"
/>
<link
  rel="apple-touch-startup-image"
  media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
  href="/splash/icon_640x1136.png"
/>
<link
  rel="apple-touch-startup-image"
  media="screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
  href="/splash/icon_1668x2388.png"
/>
<link
  rel="apple-touch-startup-image"
  media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
  href="/splash/icon_1536x2048.png"
/>
```

## 고급

```bash
# SCSS 파일 수정 시 감지하여 CSS로 즉시 변환
npm run sass

# SCSS 파일 빌드하여 CSS 파일로 변환
npm run build-style
```

`node-sass` 모듈 설치 필요 (package.json 참고)

## 이미지 출처

- App Icon: [import_contacts](https://www.material.io/resources/icons/?icon=import_contacts) icon edited by `Geunhyeok LEE`
- Icon images: [Material icons](https://www.material.io/resources/icons)
- Sample images: [Pexels](https://www.pexels.com) - CC0 Images
  - cat_1.jpg
  - cat_2.jpg
  - puppy.jpg
