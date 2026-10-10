import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('404 未匹配路由', () => {
  it('不存在的 API 路由应返回 JSON 而非 HTML', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('接口不存在');
  });

  it('不存在的非 API 路由也应返回 JSON', async () => {
    const res = await request(app).get('/unknown-path');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('message');
  });

  it('错误消息应包含 HTTP 方法和路径', async () => {
    const res = await request(app).post('/api/test');
    expect(res.body.error.message).toBe('接口不存在: POST /api/test');
  });
});