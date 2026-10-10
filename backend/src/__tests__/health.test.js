import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('健康检查 GET /api/health', () => {
  it('应返回 200 和 status: ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('应包含时间戳字段', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(typeof res.body.data.timestamp).toBe('string');
  });

  it('不应返回错误信息', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.error).toBeUndefined();
  });
});