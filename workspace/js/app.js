window.app = (function () {
  let _userName = '';

  let title = null;         // 상단 타이틀 영역
  let userNameArea = null;  // 사용자 이름 영역
  let jobSection = null;    // 업로드 대기열 영역
  let postSection = null;   // 게시물 영역
  let offlineAlert = null;  // 오프라인 알림 요소
  let postLoading = null;   // 게시물 로딩뷰
  let loading = null;       // 로딩뷰
  let paper = null;         // 글쓰기 영역 (페이퍼)

  // 글 쓰기 정보 요소 (제목, 내용, 이미지)
  let paperTitle = null;
  let paperContent = null;
  let paperImage = null;

  // 상태값 (글쓰기 영역 보이기 여부, 알림 표시 여부, 로딩 뷰 효과 타임아웃, 모달 효과 타임아웃)
  let showPaperStatus = false;
  let _loadingTimeout = null;
  let _modalTimeout = null;
  let _scrollPosition = 0;

  /**
   * DOM이 로드된 후 호출 (기본적인 요소 할당 및 이벤트 등록)
   */
  function init () {
    title = document.getElementById('title');
    userNameArea = document.getElementById('user_name');
    jobSection = document.getElementById('job');
    postSection = document.getElementById('post');
    offlineAlert = document.getElementById('offline_alert');
    postLoading = document.getElementById('post_loading');
    loading = document.getElementById('loading');
    paper = document.getElementById('paper');

    paperTitle = document.getElementById('paper_title');
    paperContent = document.getElementById('paper_content');
    paperImage = document.getElementById('paper_image');

    _userName = localStorage.getItem('name');

    title.addEventListener('click', () => {
      location.reload();
    });

    userNameArea.textContent = _userName;
    userNameArea.addEventListener('click', () => {
      localStorage.removeItem('name');
      location.href = '/login';
    });

    // 글 추가하기 버튼
    document.getElementById('open_paper')
      .addEventListener('click', () => {
      showPaperStatus = !showPaperStatus;
      initPaper();
      showPaper(showPaperStatus);
    });

    // 글쓰기 닫기 버튼
    document.getElementById('paper_close')
      .addEventListener('click', () => {
      showPaperStatus = false;
      initPaper();
      showPaper(false);
    });

    // 파일명 표시 영역
    paperImage.addEventListener('change', function () {
      document.getElementById('filename')
        .textContent = this.value.split('/').pop().split('\\').pop();
    });

    axios.defaults.headers.get['Pragma'] = 'no-cache';
    axios.defaults.headers.get['Cache-Control'] = 'no-cache, no-store';
    axios.defaults.headers.common = {
      'X-Paper-User': encodeURI(_userName)
    };
  }

  /**
   * 해당 객체가 비어있는지 확인합니다.
   * @param {object} obj 확인할 객체
   */
  function _isEmpty (obj) {
    return !Object.keys(obj).length;
  }

  /**
   * 스크롤을 방지합니다
   * @param {boolena} lock 스크롤 방지 여부
   */
  function _scrollLock (lock) {
    if (lock) {
      _scrollPosition = window.pageYOffset;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${_scrollPosition}px`;
    } else {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      window.scrollTo(0, _scrollPosition);
    }
  }

  /**
   * 해당 요소 트리를 실제 요소로 만들어 반환합니다.
   * @param {object} node 요소 트리
   */
  function createElement (node) {
    if (!node) return;

    // 베이스
    const el = document.createElement(node.type);

    // 데이터
    if (!_isEmpty(node.data || {})) {
      Object.keys(node.data).forEach((k) => {
        el.dataset[k] = node.data[k];
      });
    }

    // 속성 (class, id 등)
    if (!_isEmpty(node.attr || {})) {
      Object.keys(node.attr).forEach((k) => {
        el.setAttribute(k, node.attr[k]);
      });
    }

    // 이벤트 (click, keydown 등)
    if (!_isEmpty(node.on || {})) {
      Object.keys(node.on).forEach((k) => {
        el.addEventListener(k, node.on[k],
          // util.js
          ~k.indexOf('touch') && window._supportsPassive ?
            { passive: true } : false
        );
      });
    }

    // 텍스트
    if (node.text) {
      el.appendChild(document.createTextNode(node.text));
    }

    // HTML
    if (node.html) {
      el.innerHTML = node.html;
    }

    // 하위 요소
    if (!_isEmpty(node.child || {})) {
      for (let c of node.child) {
        const childEl = createElement(c);
        if (childEl) {
          el.appendChild(childEl);
        }
      }
    }

    return el;
  }

  /**
   * 글쓰기 영역을 초기화합니다.
   */
  function initPaper () {
    paperTitle.value = '';
    paperContent.value = '';
    paperImage.value = '';
    document.getElementById('filename').textContent = '';
  }

  /**
   * 글 작성 영역 (Paper)를 보이거나 숨깁니다.
   * @param {boolean} show
   */
  function showPaper (show) {
    showPaperStatus = show;
    clearTimeout(_modalTimeout);
    _scrollLock(show);
    if (show) {
      paper.classList.remove('hide');
      _modalTimeout = setTimeout(() => {
        paper.classList.remove('hidden');
      }, 100);
    } else {
      paper.classList.add('hidden');
      _modalTimeout = setTimeout(() => {
        paper.classList.add('hide');
      }, 400);
    }
  }

  /**
   * 로딩뷰를 지정한 값에 따라 보이거나 숨깁니다.
   * @param {boolean} show
   */
  function showLoading (show) {
    clearTimeout(_loadingTimeout);
    _scrollLock(show);
    if (show) {
      loading.classList.remove('hide');
      _loadingTimeout = setTimeout(() => {
        loading.classList.remove('hidden');
      }, 100);
    } else {
      setTimeout(() => {
        loading.classList.add('hidden');
        _loadingTimeout = setTimeout(() => {
          loading.classList.add('hide');
          loading.classList.remove('first-load');
        }, 400);
      }, 300);
    }
  }

  /**
   * 포스트 내용을 모두 지웁니다.
   */
  function clearPost () {
    postSection.innerHTML = '';
  }

  /**
   * 포스트 내용을 페이지에 추가합니다.
   * @param {object} post 포스트 내용 데이터
   */
  function renderPost (postList, config) {
    let isListUpdate = Array.isArray(postList);
    if (isListUpdate) {
      if (!postList.length) {
        return;
      }
      _scrollLock(true);
      postSection.classList.add('hide');
      postLoading.classList.remove('hide');
    } else {
      postList = [ postList ];
    }

    const onFavorite = config.onFavorite;
    const onDelete = config.onDelete;
    const prepend = config.prepend;

    const postElementList = [];

    // 해당 유저가 글 작성자인 경우 메뉴 요소 반환
    function authorMenu (post) {
      if (post.author === localStorage.getItem('name')) {
        return [
          {
            type: 'span',
            attr: {
              class: 'icon menu'
            },
            on: {
              click (event) {
                const parent = event.target.parentNode;
                const menuList = parent.querySelector('div.menu-list');
                const isOpen = menuList.classList.contains('show');

                if (isOpen) {
                  menuList.classList.remove('show');
                } else {
                  menuList.classList.add('show');
                }
              }
            }
          },
          {
            type: 'div',
            attr: {
              class: 'menu-list'
            },
            child: [
              {
                type: 'div',
                attr: {
                  class: 'menu-list__item delete'
                },
                text: '삭제',
                on: {
                  click (event) {
                    event.target.parentNode.classList.remove('show');
                    onDelete(post.id);
                  }
                }
              }
            ]
          }
        ];
      } else {
        return [];
      }
    }

    // 이미지가 존재하는 경우 이미지 요소 반환
    function imageElement (post) {
      if (post.image !== null) {
        return {
          type: 'figure',
          child: [
            {
              type: 'img',
              attr: {
                alt: '게시물 이미지',
                src: post.image
              },
              on: {
                error (event) {
                  event.target.src = '/images/no_image.png';
                }
              }
            }
          ]
        };
      }
    }

    // 게시물 갯수만큼 요소 생성
    for (let post of postList) {
      const id = post.id;
      const el = createElement({
        type: 'article',
        data: {
          id: 'post-' + id
        },
        child: [
          {
            type: 'header',
            child: [
              {
                type: 'h2',
                text: post.title,
                on: {
                  mouseenter (event) {
                    event.target.textContent = post.id;
                    event.target.classList.add('id');
                  },
                  mouseleave (event) {
                    event.target.textContent = post.title;
                    event.target.classList.remove('id');
                  },
                  touchstart (event) {
                    event.target.dispatchEvent(
                      new MouseEvent('mouseenter')
                    );
                  },
                  touchend (event) {
                    event.target.dispatchEvent(
                      new MouseEvent('mouseleave')
                    );
                  }
                }
              }
            ].concat(authorMenu(post))
          },
          {
            type: 'summary',
            child: [
              {
                type: 'div',
                attr: {
                  class: 'name'
                },
                text: post.author
              },
              {
                type: 'time',
                text: post.date
              }
            ]
          },
          imageElement(post),
          {
            type: 'p',
            html: post.content.replace(/\r\n|\n/g, '<br>')
          },
          {
            type: 'footer',
            child: [
              {
                type: 'span',
                attr: {
                  class: 'icon favorite' + (post.favorite ? ' active' : '')
                },
                on: {
                  // 좋아요 클릭 이벤트
                  click (event) {
                    const parent = event.target.parentNode;
                    const count = parent.querySelector('span.favorite-count');
                    const state = event.target.classList.contains('active');
                    let targetCount = 0;

                    try {
                      targetCount = parseInt(count.textContent) +
                        (state ? -1 : 1);
                    } catch (_) {
                      // eslint-disable-next-line no-empty
                    }
                    count.textContent = targetCount;

                    if (state) {
                      event.target.classList.remove('active');
                      if (targetCount <= 0) {
                        count.classList.add('hide');
                      }
                    } else {
                      event.target.classList.add('active');
                      if (targetCount > 0) {
                        count.classList.remove('hide');
                      }
                    }

                    onFavorite(id, !state);
                  }
                }
              },
              {
                type: 'span',
                text: '' + post.favoriteCount,
                attr: {
                  class: 'favorite-count' +
                    (post.favoriteCount > 0 ? '' : ' hide')
                }
              }
            ]
          }
        ]
      });

      postElementList.push(el);
    }

    // 게시물 섹션에 게시물 요소 추가
    postElementList.forEach((el) => {
      if (prepend) {
        postSection.insertBefore(el, postSection.firstChild);
      } else {
        postSection.appendChild(el);
      }
    });

    if (isListUpdate) {
      setTimeout(() => {
        _scrollLock(false);
        postSection.classList.remove('hide');
        postLoading.classList.add('hide');
      }, 750);
    }
  }

  /**
   * UI에 존재하는 게시물을 삭제합니다
   * @param {string} postId 게시물 ID
   */
  function removePost (postId) {
    const target = document.querySelector(`[data-id=post-${postId}]`);
    if (target) {
      postSection.removeChild(target);
    }
  }

  /**
   * 대기중인 작업을 화면에 렌더링 합니다
   * @param {array} jobList 대기중인 작업 리스트
   * @param {function} onCancel 작업 대기 취소 콜백
   */
  function renderJobList (jobList, onCancel) {
    jobSection.innerHTML = '';
    const elementList = [];

    function postContent (job) {
      if (job.action === 'upload') {
        return [
          {
            type: 'p',
            text: job.content
          },
          job.image ? {
            type: 'p',
            text: '이미지: ' + job.image.name
          } : null
        ];
      }
    }

    jobList.forEach((job) => {
      if (job.action === 'update') {
        return;
      }

      const el = createElement({
        type: 'article',
        attr: {
          class: 'job-item'
        },
        child: [
          {
            type: 'header',
            child: [
              {
                type: 'h2',
                text: job.action === 'upload' ?
                  job.title : '삭제 대기: ' + job.postId,
                attr: {
                  class: job.action === 'delete' ? 'delete' : ''
                }
              },
              {
                type: 'span',
                attr: {
                  class: 'icon clear'
                },
                on: {
                  click (event) {
                    event.stopPropagation();
                    onCancel(job.id);
                    jobSection.removeChild(el);
                  }
                }
              }
            ]
          }
        ].concat(postContent(job))
      });

      elementList.push(el);
    });

    elementList.reverse().forEach((el) => {
      jobSection.appendChild(el);
    });
  }

  return {
    init,
    showPaper,
    showLoading,
    clearPost,
    renderPost,
    removePost,
    renderJobList
  };
})();
