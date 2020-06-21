const express = require('express');
const logger = require('./server/logger');
const { init } = require('./server/bootstrap');
const { SimpleDatabase } = require('./server/database/db');
const { readFile, getDatestamp, getUser } = require('./server/util');
const { publicKey, sendNotification } = require('./push');

// user.json, post.json 로드 및 자동커밋 활성화
// (INSERT, UPDATE, DELETE 작업 시 자동 저장)
SimpleDatabase.load(['user', 'post']);
SimpleDatabase.setConfig({ autoCommit: true });
const simpleQuery = require('./server/database/simpleQuery');

global.__maindir = __dirname;
const app = express();

// 업로드 이미지 저장 폴더: upload
app.set('IMAGE_PATH', 'upload');
const { run, upload } = init(app);

/* 메인 페이지 */
app.get('/', (_req, res) => {
  readFile('index.html')
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      logger.error(err);
      res.send('Error: ' + err);
    });
});

/* 로그인 페이지 */
app.get('/login', (_req, res) => {
  readFile('login.html')
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      logger.error(err);
      res.send('Error: ' + err);
    });
});

/*---------- REST API -----------*/
/**
 * 게시물 목록 조회
 * @endpoint /api/posts
 * @method GET
 */
app.get('/api/posts', (req, res) => {
  const user = getUser(req.headers);

  try {
    const posts = simpleQuery.getPost(user);
    res.status(200).json(posts);
  } catch (err) {
    logger.error(err.message);
    res.status(500).end();
  }
});


/**
 * 게시물 신규 작성
 * @endpoint /api/posts
 * @method POST
 */
app.post('/api/posts', upload.single('image'), (req, res) => {
  const id = +new Date();
  const dateString = getDatestamp();
  const author = getUser(req.headers);
  const title = req.body.title;
  const content = req.body.content;
  let image = null;

  // 유저가 이미지를 업로드한 경우
  if (req.file) {
    image = `/${app.get('IMAGE_PATH')}/${req.file.filename}`;
  }

  try {
    const post = SimpleDatabase.insert('post', {
      data: {
        id,
        author,
        title,
        date: dateString,
        content,
        image,
        favorite: []
      }
    });

    if (post) {
      res.status(201).json(Object.assign({}, post, {
        favorite: false,
        favoriteCount: 0
      }));
    } else {
      res.status(400).end();
    }
  } catch (err) {
    logger.error(err.message);
    res.status(500).end();
  }
});


/**
 * 게시물 삭제
 * @endpoint /api/posts/:id
 *   id - 삭제 대상 게시물 ID
 * @method DELETE
 */
app.delete('/api/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = getUser(req.headers);

  try {
    const deletedPost = SimpleDatabase.delete('post', {
      where: {
        id,
        author: user
      }
    });

    if (deletedPost) {
      res.status(200).json(deletedPost);
    } else {
      res.status(409).end();
    }
  } catch (err) {
    logger.error(err.message);
    res.status(500).end();
  }
});


/**
 * 게시물 수정 (좋아요 데이터 수정)
 * @endpoint /api/posts/:id
 *   id - 수정 대상 게시물 ID
 * @method PUT
 */
app.put('/api/posts/:id', (req, res) => {
  const id = parseInt(req.params.id); // 좋아요를 누른 게시물 ID
  const user = getUser(req.headers);  // 좋아요를 누른 사용자 이름
  const state = req.body.state;       // 좋아요 상태

  try {
    // 좋아요 추가/삭제
    const updatedPost = simpleQuery.updateFavorite(user, {
      id,
      state
    });

    // 게시물 좋아요 값 반영 여부
    if (updatedPost) {
      res.status(200).json(updatedPost);
    } else {
      res.status(400).end();
      return;
    }

    // @ch10. 좋아요 푸시 알림 전송
    if (!state) {
      return;
    } else if (user === updatedPost.author) {
      logger.debug('본인 게시물에 좋아요를 눌렀습니다.');
    } else {
      // 푸시 알림을 받게될 사용자 정보
      const targetUser = SimpleDatabase.select('user', {
        where: {
          id: updatedPost.author
        }
      });

      if (targetUser && targetUser.subscription) {
        const data = {
          message: `${user}님이 회원님의 게시물을 좋아합니다!`,
          badge: '/icons/push-badge-72x72.png',
          icon: '/icons/push-icon-192x192.png'
        };

        // 구현했던 sendNotification 함수 사용
        sendNotification(targetUser.subscription, data).then((response) => {
          if (response.statusCode === 201) {
            logger.success('알림이 전송되었습니다.');
          } else {
            logger.info(response);
          }
        }).catch((err) => {
          logger.error(err.body.trim());
        });
      } else {
        logger.debug('게시물 작성자의 구독 정보가 존재하지 않습니다.');
      }
    }
  } catch (err) {
    logger.error(err.message);
    res.status(500).end();
  }
});


/**
 * @ch10 공개키 제공 API
 * @endpoint /api/publicKey
 * @method GET
 */
app.get('/api/publicKey', (_req, res) => {
  res.send(publicKey);
});

/**
 * @ch10 구독 정보 저장 API
 * @endpoint /api/pushSubscription
 * @method POST
 */
app.post('/api/pushSubscription', (req, res) => {
  const user = getUser(req.headers);
  const subscription = req.body.subscription;

  // 해당 유저의 구독 정보 저장
  const inserted = SimpleDatabase.upsert('user', {
    where: {
      id: user
    },
    data: {
      subscription
    }
  });

  if (inserted) {
    if (subscription) {
      logger.success(`${user}님이 푸시 서비스를 구독했습니다.`);
    } else {
      logger.success(`${user}님이 푸시 서비스 구독을 취소했습니다.`);
    }

    res.status(200).json({ user });
  } else {
    res.status(500).end();
  }
});

// 서버 실행
run();
