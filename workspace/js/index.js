// 사용자 정보가 존재하지 않는다면 로그인 페이지로 이동
if (!localStorage.getItem('name')) {
  location.href = '/login';
}

// window.onload
$(function () {
  // 푸시 지원 여부
  let pushSupport = false;
  // 사용자 구독 정보
  let userSubscription = null;

  const notificationControl = document.getElementById('notification_control');
  const notificationButton = document.getElementById('notification');
  const paperTitle = document.getElementById('paper_title');
  const paperContent = document.getElementById('paper_content');
  const paperImage = document.getElementById('paper_image');
  const submitButton = document.getElementById('paper_submit');
  const userName = localStorage.getItem('name') || '';

  // 앱 초기화
  app.init();

  // 알림 버튼
  notificationButton.addEventListener('click', () => {
    // @ch10. 권한 확인 및 요청
  });

  // 게시물 작성 버튼
  submitButton.addEventListener('click', () => {
    // 제목과 본문이 비어있는지 확인
    if (paperTitle.value && paperContent.value) {
      const title = paperTitle.value;
      const content = paperContent.value;
      const image = paperImage.files[0];

      app.showLoading(true);
      uploadPost(title, content, image)
        .then((post) => {
          app.renderPost(post, {
            onFavorite,
            onDelete,
            prepend: true
          });

          // @ch6. IndexedDB에 게시물 데이터 저장
        })
        .catch(() => {
          // @ch8. 게시물 업로드 작업 등록
        })
        .finally(() => {
          app.showLoading(false);
          app.showPaper(false);
        });
    } else {
      util.message('내용을 입력해주세요');
    }
  });

  // 게시물 목록 업데이트
  function updatePostList () {
    app.clearPost();
    // 게시물 가져오기
    return axios.get('/api/posts')
      .then((response) => {
        const posts = response.data;

        // 게시물 화면에 렌더링
        app.renderPost(posts, {
          onFavorite,
          onDelete
        });

        // @ch6. IndexedDB에 게시물 데이터 저장
      })
      .catch(() => {
        // @ch6. IndexedDB에 저장해둔 게시물 불러오기
      });
  }

  // 동기화 작업 목록 업데이트
  function updateJobList () {
    // @ch8. IndexedDB 작업 데이터 조회 및 화면에 표시
  }

  // 게시물 업로드
  function uploadPost (title, content, image) {
    const formData = new FormData();
    formData.append('user', userName);
    formData.append('title', title);
    formData.append('content', content);
    formData.append('image', image);

    return axios.post('/api/posts', formData)
      .then((response) => response.data);
  }

  // 게시물 수정 (좋아요)
  function updatePost (id, state) {
    return axios.put('/api/posts/' + id, { state })
      .then((response) => response.data);
  }

  // 게시물 삭제
  function deletePost (id) {
    return axios.delete('/api/posts/' + id)
      .then((response) => response.data);
  }

  // 좋아요 핸들러
  function onFavorite (id, state) {
    updatePost(id, state)
      .then(() => {
        // @ch6. IndexedDB 게시물 좋아요 상태 갱신
      })
      .catch(() => {
        // @ch8. 게시물 업데이트 작업 등록
      });
  }

  // 게시물 삭제 이벤트 핸들러
  function onDelete (id) {
    app.showLoading(true);
    deletePost(id)
      .then((post) => {
        app.removePost(post.id);

        // @ch6. IndexedDB에 저장되어있던 게시물 삭제
      })
      .catch(() => {
        // @ch8. 게시물 삭제 작업 등록
      })
      .finally(() => {
        app.showLoading(false);
      });
  }

  // 동기화 작업 취소 핸들러
  function onCancel (jobId) {
    // @ch8. 작업 삭제
  }

  // 대기 중인 작업 수행
  function doJobs () {
    // @ch8. 대기중인 작업 수행
  }

  // 백그라운드 동기화 작업 요청
  function requestBackgroundSync () {
    // @ch8. 백그라운드 동기화 작업 등록
  }

  // 서비스 워커에게 메시지 전달
  function toServiceWorker (action, payload) {
    // @ch9. 메시지 전달을 통해 서비스 워커에게 작업 요청
  }

  // 푸시 구독
  function pushSubscribe () {
    // @ch10. 푸시 구독 기능 구현
  }

  // 푸시 구독 취소
  function pushUnsubscribe () {
    // @ch10. 푸시 구독 취소 기능 구현
  }

  // 구독 정보 서버로 전달
  function updateSubscription (subscription) {
    // @ch10. 푸시 구독 정보 전송 기능 구현
  }

  // 구독 상태에 따라 버튼 스타일 변경
  function updatePushButton () {
    // @ch10. 푸시 구독 상태에 따라 버튼 갱신 기능 구현
  }

  // Paper 초기 로딩
  (function init () {
    Promise.all([
      updatePostList()
    ]);
  })();

  // @ch9. 서비스 워커 메시지 이벤트 핸들러 구현
});
