const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { config } = require('../config');

const SOCIAL_DIR = path.resolve(__dirname, '..', '..', '..', 'data', 'community');
const COLLECTIONS = ['accounts', 'tastes', 'meal_history', 'posts', 'comments', 'reactions', 'notifications', 'ratings'];

function createId(prefix) {
  return prefix + Date.now().toString(36) + crypto.randomBytes(5).toString('hex');
}

function now() {
  return new Date().toISOString();
}

function matches(item, query) {
  return Object.entries(query).every(([key, value]) => item[key] === value);
}

class FileSocialStore {
  _file(name) {
    return path.join(SOCIAL_DIR, name + '.json');
  }

  _read(name) {
    const file = this._file(name);
    if (!fs.existsSync(SOCIAL_DIR)) fs.mkdirSync(SOCIAL_DIR, { recursive: true });
    if (!fs.existsSync(file)) fs.writeFileSync(file, '[]', 'utf8');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  _write(name, data) {
    if (!fs.existsSync(SOCIAL_DIR)) fs.mkdirSync(SOCIAL_DIR, { recursive: true });
    const file = this._file(name);
    const temp = file + '.tmp-' + process.pid + '-' + Date.now();
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(temp, file);
  }

  all(name) { return this._read(name); }
  findOne(name, query) { return this._read(name).find(item => matches(item, query)) || null; }
  insert(name, value) { const items = this._read(name); items.push(value); this._write(name, items); return value; }
  updateWhere(name, query, patch) {
    const items = this._read(name);
    let count = 0;
    for (const item of items) {
      if (matches(item, query)) { Object.assign(item, patch); count += 1; }
    }
    if (count) this._write(name, items);
    return count;
  }
  deleteWhere(name, query) {
    const items = this._read(name);
    const kept = items.filter(item => !matches(item, query));
    if (kept.length !== items.length) this._write(name, kept);
    return items.length - kept.length;
  }
}

class CloudBaseSocialStore {
  constructor() { this._initialized = false; this._db = null; }

  _ensureInit() {
    if (this._initialized) return;
    const cloudbase = require('@cloudbase/node-sdk');
    const envId = process.env.ENV_ID || process.env.TCB_ENV;
    const app = envId ? cloudbase.init({ env: envId }) : cloudbase.init();
    this._db = app.database();
    this._initialized = true;
  }

  _collection(name) {
    this._ensureInit();
    return this._db.collection(name);
  }

  async all(name) {
    const result = await this._collection(name).limit(1000).get();
    return result.data || [];
  }

  async findOne(name, query) {
    const result = await this._collection(name).where(query).limit(1).get();
    return result.data && result.data[0] ? result.data[0] : null;
  }

  async insert(name, value) {
    await this._collection(name).add(value);
    return value;
  }

  async updateWhere(name, query, patch) {
    const result = await this._collection(name).where(query).get();
    const items = result.data || [];
    for (const item of items) await this._collection(name).doc(item._id).update(patch);
    return items.length;
  }

  async deleteWhere(name, query) {
    const result = await this._collection(name).where(query).get();
    const items = result.data || [];
    for (const item of items) await this._collection(name).doc(item._id).remove();
    return items.length;
  }
}

const activeStore = config.socialStorage === 'cloudbase' ? new CloudBaseSocialStore() : new FileSocialStore();

async function updateById(collection, field, value, patch) {
  return activeStore.updateWhere(collection, { [field]: value }, patch);
}

async function getAccount(anonymousId) {
  return activeStore.findOne('accounts', { anonymous_id: anonymousId });
}

async function updateAccount(anonymousId, patch) {
  const count = await updateById('accounts', 'anonymous_id', anonymousId, patch);
  if (!count) return null;
  return getAccount(anonymousId);
}

async function ensureAccount(anonymousId) {
  const existing = await getAccount(anonymousId);
  if (existing) return existing;
  const timestamp = now();
  return activeStore.insert('accounts', {
    account_id: createId('acc_'),
    anonymous_id: anonymousId,
    provider: null,
    provider_subject: null,
    display_name: '匿名用户',
    avatar: '🍊',
    status: 'active',
    created_at: timestamp,
    updated_at: timestamp,
  });
}

async function getTaste(anonymousId) {
  return activeStore.findOne('tastes', { anonymous_id: anonymousId });
}

async function saveTaste(anonymousId, data) {
  const existing = await getTaste(anonymousId);
  const value = {
    anonymous_id: anonymousId,
    flavors: data.flavors || [],
    avoid: data.avoid || [],
    updated_at: now(),
  };
  if (existing) {
    await updateById('tastes', 'anonymous_id', anonymousId, value);
    return { ...existing, ...value };
  }
  return activeStore.insert('tastes', { taste_id: createId('taste_'), ...value });
}

async function listHistory(anonymousId, { page = 1, pageSize = 30 } = {}) {
  const items = (await activeStore.all('meal_history'))
    .filter(item => item.anonymous_id === anonymousId)
    .sort((a, b) => new Date(b.eaten_at) - new Date(a.eaten_at));
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

async function addHistory(anonymousId, data) {
  if (data.client_id) {
    const existing = await activeStore.findOne('meal_history', { anonymous_id: anonymousId, client_id: data.client_id });
    if (existing) return existing;
  }
  return activeStore.insert('meal_history', {
    history_id: createId('meal_'),
    anonymous_id: anonymousId,
    client_id: data.client_id || null,
    dish_id: data.dish_id || null,
    dish_snapshot: data.dish_snapshot || null,
    source: data.source || 'manual',
    eaten_at: data.eaten_at || now(),
  });
}

async function deleteHistory(historyId, anonymousId) {
  return activeStore.deleteWhere('meal_history', { history_id: historyId, anonymous_id: anonymousId });
}

async function listPosts({ page = 1, pageSize = 20, keyword = '' } = {}) {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase();
  const items = (await activeStore.all('posts'))
    .filter(item => item.status !== 'deleted')
    .filter(item => {
      if (!normalizedKeyword) return true;
      const dishName = item.dish_snapshot?.dish_name || '';
      return `${item.content || ''} ${dishName}`.toLowerCase().includes(normalizedKeyword);
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

async function getPost(postId) {
  return activeStore.findOne('posts', { post_id: postId });
}

async function createPost(data) {
  const timestamp = now();
  return activeStore.insert('posts', {
    post_id: createId('post_'),
    anonymous_id: data.anonymous_id,
    author_name: data.author_name || '匿名用户',
    author_avatar: data.author_avatar || '🍊',
    content: data.content,
    dish_id: data.dish_id || null,
    dish_snapshot: data.dish_snapshot || null,
    status: 'active',
    like_count: 0,
    favorite_count: 0,
    comment_count: 0,
    created_at: timestamp,
    updated_at: timestamp,
  });
}

async function createComment(data) {
  return activeStore.insert('comments', {
    comment_id: createId('comment_'),
    post_id: data.post_id,
    parent_id: data.parent_id || null,
    anonymous_id: data.anonymous_id,
    author_name: data.author_name || '匿名用户',
    author_avatar: data.author_avatar || '🍊',
    content: data.content,
    status: 'active',
    created_at: now(),
  });
}

async function bumpCommentCount(postId, delta = 1) {
  const post = await getPost(postId);
  if (!post) return null;
  await updateById('posts', 'post_id', postId, { comment_count: Math.max(0, (post.comment_count || 0) + delta), updated_at: now() });
  return { ...post, comment_count: Math.max(0, (post.comment_count || 0) + delta) };
}

async function listComments(postId) {
  return (await activeStore.all('comments'))
    .filter(item => item.post_id === postId && item.status !== 'deleted')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

async function getComment(commentId) {
  return activeStore.findOne('comments', { comment_id: commentId });
}

async function toggleReaction({ postId, anonymousId, kind }) {
  const existing = await activeStore.findOne('reactions', { post_id: postId, anonymous_id: anonymousId, kind });
  if (existing) {
    await activeStore.deleteWhere('reactions', { reaction_id: existing.reaction_id });
    const post = await getPost(postId);
    const field = kind === 'like' ? 'like_count' : 'favorite_count';
    if (post) await updateById('posts', 'post_id', postId, { [field]: Math.max(0, (post[field] || 0) - 1), updated_at: now() });
    return { active: false };
  }
  await activeStore.insert('reactions', {
    reaction_id: createId('reaction_'), post_id: postId, anonymous_id: anonymousId, kind, created_at: now(),
  });
  const post = await getPost(postId);
  const field = kind === 'like' ? 'like_count' : 'favorite_count';
  if (post) await updateById('posts', 'post_id', postId, { [field]: (post[field] || 0) + 1, updated_at: now() });
  return { active: true };
}

async function hasReaction(postId, anonymousId, kind) {
  return !!(anonymousId && await activeStore.findOne('reactions', { post_id: postId, anonymous_id: anonymousId, kind }));
}

async function markPostDeleted(postId) {
  await updateById('posts', 'post_id', postId, { status: 'deleted', updated_at: now() });
}

async function markCommentDeleted(commentId) {
  await updateById('comments', 'comment_id', commentId, { status: 'deleted' });
}

async function addNotification(data) {
  if (!data.recipient_id || data.recipient_id === data.actor_id) return null;
  return activeStore.insert('notifications', {
    notification_id: createId('notice_'),
    recipient_id: data.recipient_id,
    actor_id: data.actor_id,
    type: data.type,
    target_id: data.target_id,
    post_id: data.post_id || null,
    content: data.content,
    read_at: null,
    created_at: now(),
  });
}

async function listNotifications(anonymousId, { page = 1, pageSize = 30 } = {}) {
  const items = (await activeStore.all('notifications'))
    .filter(item => item.recipient_id === anonymousId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length, unread: items.filter(item => !item.read_at).length, page, pageSize };
}

async function markNotificationRead(notificationId, anonymousId) {
  return activeStore.updateWhere('notifications', { notification_id: notificationId, recipient_id: anonymousId }, { read_at: now() });
}

async function listUserReactionPosts(anonymousId, kind, { page = 1, pageSize = 30 } = {}) {
  const reactions = (await activeStore.all('reactions')).filter(item => item.anonymous_id === anonymousId && item.kind === kind);
  const ids = new Set(reactions.map(item => item.post_id));
  const posts = (await activeStore.all('posts'))
    .filter(item => ids.has(item.post_id) && item.status !== 'deleted')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const start = (page - 1) * pageSize;
  return { data: posts.slice(start, start + pageSize), total: posts.length, page, pageSize };
}

async function saveRating(data) {
  const existing = await activeStore.findOne('ratings', { dish_id: data.dish_id, anonymous_id: data.anonymous_id });
  const value = { rating: data.rating, updated_at: now() };
  if (existing) {
    await updateById('ratings', 'rating_id', existing.rating_id, value);
    return { ...existing, ...value };
  }
  return activeStore.insert('ratings', { rating_id: createId('rating_'), dish_id: data.dish_id, anonymous_id: data.anonymous_id, rating: data.rating, created_at: now(), updated_at: now() });
}

async function ratingSummary(dishIds = []) {
  const items = (await activeStore.all('ratings')).filter(item => !dishIds.length || dishIds.includes(item.dish_id));
  const grouped = {};
  for (const item of items) {
    if (!grouped[item.dish_id]) grouped[item.dish_id] = { dish_id: item.dish_id, count: 0, total: 0 };
    grouped[item.dish_id].count += 1;
    grouped[item.dish_id].total += Number(item.rating);
  }
  return Object.values(grouped).map(item => ({ dish_id: item.dish_id, rating_count: item.count, rating_average: Number((item.total / item.count).toFixed(2)) }));
}

async function deleteAccount(anonymousId) {
  await updateById('accounts', 'anonymous_id', anonymousId, { status: 'deleted', display_name: '已注销用户', avatar: '👤', deleted_at: now(), updated_at: now() });
  await activeStore.updateWhere('posts', { anonymous_id: anonymousId }, { anonymous_id: null, author_name: '已注销用户', author_avatar: '👤', updated_at: now() });
  await activeStore.updateWhere('comments', { anonymous_id: anonymousId }, { anonymous_id: null, author_name: '已注销用户', author_avatar: '👤' });
  await activeStore.deleteWhere('tastes', { anonymous_id: anonymousId });
  await activeStore.deleteWhere('meal_history', { anonymous_id: anonymousId });
  await activeStore.deleteWhere('reactions', { anonymous_id: anonymousId });
  await activeStore.deleteWhere('ratings', { anonymous_id: anonymousId });
  await activeStore.deleteWhere('notifications', { recipient_id: anonymousId });
  await activeStore.deleteWhere('notifications', { actor_id: anonymousId });
}

module.exports = {
  ensureAccount, getAccount, updateAccount, saveTaste, getTaste,
  listHistory, addHistory, deleteHistory,
  listPosts, getPost, createPost,
  createComment, bumpCommentCount, listComments, getComment,
  toggleReaction, hasReaction,
  markPostDeleted, markCommentDeleted,
  addNotification, listNotifications, markNotificationRead, listUserReactionPosts,
  saveRating, ratingSummary, deleteAccount,
  _collections: COLLECTIONS,
};
