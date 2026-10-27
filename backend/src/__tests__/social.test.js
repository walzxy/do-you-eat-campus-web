import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../app.js';

const SOCIAL_DIR = path.resolve(__dirname, '..', '..', '..', 'data', 'community');
const USER_A = 'anon_social_a01';
const USER_B = 'anon_social_b01';

function asUser(req, id = USER_A) {
  return req.set('X-Anonymous-Id', id);
}

beforeEach(() => {
  fs.rmSync(SOCIAL_DIR, { recursive: true, force: true });
});

afterEach(() => {
  fs.rmSync(SOCIAL_DIR, { recursive: true, force: true });
});

describe('匿名账号与社区接口', () => {
  it('可以建立匿名账号并读取个人资料', async () => {
    const session = await request(app).post('/api/account/session').set('X-Anonymous-Id', USER_A).send({ anonymous_id: USER_A });
    expect(session.status).toBe(201);
    expect(session.body.data.account.status).toBe('active');

    const me = await asUser(request(app).get('/api/account/me'));
    expect(me.status).toBe(200);
    expect(me.body.data.account.anonymous_id).toBe(USER_A);
  });

  it('可以修改昵称和口味画像，但拒绝非法口味', async () => {
    await request(app).post('/api/account/session').set('X-Anonymous-Id', USER_A).send({ anonymous_id: USER_A });
    const profile = await asUser(request(app).patch('/api/account/me')).send({ display_name: '饭团' });
    expect(profile.status).toBe(200);
    expect(profile.body.data.display_name).toBe('饭团');

    const taste = await asUser(request(app).put('/api/account/taste')).send({ flavors: ['清淡', '微辣'], avoid: ['香菜'] });
    expect(taste.status).toBe(200);
    expect(taste.body.data.flavors).toEqual(['清淡', '微辣']);

    const invalid = await asUser(request(app).put('/api/account/taste')).send({ flavors: ['重口味'], avoid: [] });
    expect(invalid.status).toBe(400);
  });

  it('帖子按最新发布返回，支持菜品卡片', async () => {
    await request(app).post('/api/account/session').set('X-Anonymous-Id', USER_A).send({ anonymous_id: USER_A });
    const created = await asUser(request(app).post('/api/community/posts')).send({ content: '今天吃米线', dish_id: 'D001' });
    expect(created.status).toBe(201);
    expect(created.body.data.dish_snapshot.dish_id).toBe('D001');

    const list = await request(app).get('/api/community/posts');
    expect(list.status).toBe(200);
    expect(list.body.data.data[0].content).toBe('今天吃米线');

    const searched = await request(app).get('/api/community/posts?keyword=米线');
    expect(searched.body.data.total).toBe(1);
  });

  it('点赞和收藏可以切换，并产生通知', async () => {
    await request(app).post('/api/account/session').set('X-Anonymous-Id', USER_A).send({ anonymous_id: USER_A });
    const created = await asUser(request(app).post('/api/community/posts')).send({ content: '来吃饭' });
    const postId = created.body.data.post_id;
    await request(app).post('/api/account/session').set('X-Anonymous-Id', USER_B).send({ anonymous_id: USER_B });

    const liked = await asUser(request(app).post(`/api/community/posts/${postId}/like`), USER_B);
    expect(liked.body.data.active).toBe(true);
    const notice = await asUser(request(app).get('/api/notifications'), USER_A);
    expect(notice.body.data.unread).toBe(1);

    const unliked = await asUser(request(app).post(`/api/community/posts/${postId}/like`), USER_B);
    expect(unliked.body.data.active).toBe(false);
  });

  it('评论支持多层回复', async () => {
    await request(app).post('/api/account/session').set('X-Anonymous-Id', USER_A).send({ anonymous_id: USER_A });
    const created = await asUser(request(app).post('/api/community/posts')).send({ content: '评论测试' });
    const postId = created.body.data.post_id;
    const first = await asUser(request(app).post(`/api/community/posts/${postId}/comments`)).send({ content: '第一层' });
    const second = await asUser(request(app).post(`/api/community/posts/${postId}/comments`)).send({ content: '第二层', parent_id: first.body.data.comment_id });
    expect(second.status).toBe(201);
    const comments = await request(app).get(`/api/community/posts/${postId}/comments`);
    expect(comments.body.data).toHaveLength(2);
    expect(comments.body.data[1].parent_id).toBe(first.body.data.comment_id);
  });

  it('饭录和五星评分可以写入', async () => {
    await request(app).post('/api/account/session').set('X-Anonymous-Id', USER_A).send({ anonymous_id: USER_A });
    const history = await asUser(request(app).post('/api/account/history')).send({ client_id: 'local_1', dish_id: 'D001', source: 'wheel' });
    expect(history.status).toBe(201);
    const rating = await asUser(request(app).post('/api/community/dishes/D001/rating')).send({ rating: 5 });
    expect(rating.status).toBe(200);
    expect(rating.body.data.rating_average).toBe(5);
    const rankings = await request(app).get('/api/community/rankings');
    expect(rankings.body.data.data[0].dish_id).toBe('D001');
  });

  it('注销账号后帖子仍保留但作者变为已注销用户', async () => {
    await request(app).post('/api/account/session').set('X-Anonymous-Id', USER_A).send({ anonymous_id: USER_A });
    const created = await asUser(request(app).post('/api/community/posts')).send({ content: '保留内容测试' });
    await asUser(request(app).delete('/api/account'));
    const list = await request(app).get('/api/community/posts');
    expect(list.body.data.data[0].content).toBe('保留内容测试');
    expect(list.body.data.data[0].author_name).toBe('已注销用户');
    const me = await asUser(request(app).get('/api/account/me'));
    expect(me.status).toBe(410);
  });
});
