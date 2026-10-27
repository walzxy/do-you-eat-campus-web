const socialRepository = require('../repositories/socialRepository');
const dishRepository = require('../repositories/dishRepository');
const { success, fail } = require('../utils/response');

const MAX_POST_LENGTH = 1000;
const MAX_COMMENT_LENGTH = 500;

function actorId(req) { return req.anonymousId; }

async function getAccount(req, res) {
  const account = await socialRepository.getAccount(actorId(req));
  if (!account || account.status === 'deleted') {
    fail(res, '请先建立匿名账号会话', 401);
    return null;
  }
  return account;
}

function dishSnapshot(dish) {
  if (!dish) return null;
  return {
    dish_id: dish.dish_id,
    dish_name: dish.dish_name,
    price_min: dish.price_min,
    price_max: dish.price_max,
    cafeteria_id: dish.cafeteria_id,
    cafeteria_name: dish.cafeteria_name,
    window_id: dish.window_id,
    window_name: dish.window_name,
    flavor: dish.flavor,
    is_packable: dish.is_packable,
  };
}

async function listPosts(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
    const keyword = String(req.query.keyword || '').trim().slice(0, 80);
    const result = await socialRepository.listPosts({ page, pageSize, keyword });
    const data = await Promise.all(result.data.map(async post => ({
      ...post,
      liked: await socialRepository.hasReaction(post.post_id, actorId(req), 'like'),
      favorited: await socialRepository.hasReaction(post.post_id, actorId(req), 'favorite'),
    })));
    return success(res, { ...result, data });
  } catch (error) { return next(error); }
}

async function getPost(req, res, next) {
  try {
    const post = await socialRepository.getPost(req.params.postId);
    if (!post || post.status === 'deleted') return fail(res, '帖子不存在', 404);
    const comments = await socialRepository.listComments(post.post_id);
    return success(res, {
      ...post,
      liked: await socialRepository.hasReaction(post.post_id, actorId(req), 'like'),
      favorited: await socialRepository.hasReaction(post.post_id, actorId(req), 'favorite'),
      comments,
    });
  } catch (error) { return next(error); }
}

async function createPost(req, res, next) {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    const { content, dish_id } = req.body || {};
    if (typeof content !== 'string' || !content.trim()) return fail(res, '帖子内容不能为空', 400);
    if (content.trim().length > MAX_POST_LENGTH) return fail(res, '帖子内容不能超过 ' + MAX_POST_LENGTH + ' 个字符', 400);
    const dish = dish_id ? dishRepository.findById(dish_id) : null;
    if (dish_id && !dish) return fail(res, '菜品不存在: ' + dish_id, 400);
    const post = await socialRepository.createPost({
      anonymous_id: actorId(req),
      author_name: account.display_name,
      author_avatar: account.avatar,
      content: content.trim(),
      dish_id: dish ? dish.dish_id : null,
      dish_snapshot: dishSnapshot(dish),
    });
    return success(res, post, 201);
  } catch (error) { return next(error); }
}

async function deletePost(req, res, next) {
  try {
    const post = await socialRepository.getPost(req.params.postId);
    if (!post || post.status === 'deleted') return fail(res, '帖子不存在', 404);
    if (post.anonymous_id !== actorId(req)) return fail(res, '只能删除自己的帖子', 403);
    await socialRepository.markPostDeleted(post.post_id);
    return success(res, { deleted: true });
  } catch (error) { return next(error); }
}

async function toggleReaction(req, res, next) {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    const post = await socialRepository.getPost(req.params.postId);
    if (!post || post.status === 'deleted') return fail(res, '帖子不存在', 404);
    const kind = req.params.kind;
    if (!['like', 'favorite'].includes(kind)) return fail(res, '互动类型无效', 400);
    const result = await socialRepository.toggleReaction({ postId: post.post_id, anonymousId: actorId(req), kind });
    if (result.active) {
      await socialRepository.addNotification({
        recipient_id: post.anonymous_id,
        actor_id: actorId(req),
        type: kind,
        target_id: post.post_id,
        post_id: post.post_id,
        content: kind === 'like' ? '赞了你的帖子' : '收藏了你的帖子',
      });
    }
    return success(res, result);
  } catch (error) { return next(error); }
}

async function listComments(req, res, next) {
  try { return success(res, await socialRepository.listComments(req.params.postId)); }
  catch (error) { return next(error); }
}

async function createComment(req, res, next) {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    const post = await socialRepository.getPost(req.params.postId);
    if (!post || post.status === 'deleted') return fail(res, '帖子不存在', 404);
    const { content, parent_id } = req.body || {};
    if (typeof content !== 'string' || !content.trim()) return fail(res, '评论内容不能为空', 400);
    if (content.trim().length > MAX_COMMENT_LENGTH) return fail(res, '评论内容不能超过 ' + MAX_COMMENT_LENGTH + ' 个字符', 400);
    if (parent_id) {
      const parent = (await socialRepository.listComments(post.post_id)).find(item => item.comment_id === parent_id);
      if (!parent) return fail(res, '回复目标不存在', 400);
    }
    const comment = await socialRepository.createComment({
      post_id: post.post_id,
      parent_id: parent_id || null,
      anonymous_id: actorId(req),
      author_name: account.display_name,
      author_avatar: account.avatar,
      content: content.trim(),
    });
    await socialRepository.bumpCommentCount(post.post_id, 1);
    await socialRepository.addNotification({ recipient_id: post.anonymous_id, actor_id: actorId(req), type: 'comment', target_id: post.post_id, post_id: post.post_id, content: '评论了你的帖子' });
    if (parent_id) {
      const parent = (await socialRepository.listComments(post.post_id)).find(item => item.comment_id === parent_id);
      await socialRepository.addNotification({ recipient_id: parent?.anonymous_id, actor_id: actorId(req), type: 'reply', target_id: parent_id, post_id: post.post_id, content: '回复了你的评论' });
    }
    return success(res, comment, 201);
  } catch (error) { return next(error); }
}

async function deleteComment(req, res, next) {
  try {
    const comment = await socialRepository.getComment(req.params.commentId);
    if (!comment || comment.status === 'deleted') return fail(res, '评论不存在', 404);
    if (comment.anonymous_id !== actorId(req)) return fail(res, '只能删除自己的评论', 403);
    await socialRepository.markCommentDeleted(comment.comment_id);
    return success(res, { deleted: true });
  } catch (error) { return next(error); }
}

async function saveRating(req, res, next) {
  try {
    const account = await getAccount(req, res);
    if (!account) return;
    const dish = dishRepository.findById(req.params.dishId);
    if (!dish) return fail(res, '菜品不存在: ' + req.params.dishId, 404);
    const rating = Number(req.body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail(res, '评分必须是 1-5 的整数', 400);
    const saved = await socialRepository.saveRating({ dish_id: dish.dish_id, anonymous_id: actorId(req), rating });
    const summary = (await socialRepository.ratingSummary([dish.dish_id]))[0] || { dish_id: dish.dish_id, rating_count: 0, rating_average: 0 };
    return success(res, { rating: saved.rating, ...summary });
  } catch (error) { return next(error); }
}

async function ratingRankings(req, res, next) {
  try {
    const summaries = await socialRepository.ratingSummary();
    const dishes = summaries.map(summary => ({ ...summary, dish: dishRepository.findById(summary.dish_id) })).filter(item => item.dish);
    dishes.sort((a, b) => b.rating_average - a.rating_average || b.rating_count - a.rating_count);
    return success(res, { data: dishes.slice(0, 50) });
  } catch (error) { return next(error); }
}

async function listFavorites(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 30));
    return success(res, await socialRepository.listUserReactionPosts(actorId(req), 'favorite', { page, pageSize }));
  } catch (error) { return next(error); }
}

module.exports = { listPosts, getPost, createPost, deletePost, toggleReaction, listComments, createComment, deleteComment, saveRating, ratingRankings, listFavorites };
