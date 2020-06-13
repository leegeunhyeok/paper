const { SimpleDatabase } = require('./db');

// 게시물 조회
exports.getPost = (user, config) => {
  config = config || {};
  const posts = SimpleDatabase.select('post', {
    offset: config.offset,
    limit: config.limit
  });

  // 사용자에 따라 좋아요 여부값 반영
  return posts.map((post) => {
    return Object.assign(Object.assign({}, post), {
      favorite: post.favorite.includes(user),
      favoriteCount: post.favorite.length
    });
  });
};

// 좋아요 상태 업데이트
exports.updateFavorite = (user, postInfo) => {
  let post = SimpleDatabase.select('post', {
    where: {
      id: postInfo.id
    }
  });

  post = Array.isArray(post) ? post[0] : post;

  if (!post) {
    return null;
  }

  // 좋아요 활성화 상태, 게시물에 해당 유저의 좋아요가 없다면 추가
  if (postInfo.state && !post.favorite.includes(user)) {
    post.favorite.push(user);
  }

  // 좋아요 비활성화 상태, 게시물에 해당 유저의 좋아요가 있다면 삭제
  if (!postInfo.state && post.favorite.includes(user)) {
    const idx = post.favorite.indexOf(user);
    post.favorite.splice(idx, 1);
  }

  // 해당 id의 게시물을 post로 치환
  SimpleDatabase.__replace('post', {
    where: {
      id: postInfo.id
    }
  }, post);

  return post;
};
