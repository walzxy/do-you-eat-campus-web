import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import fs from 'fs';
import path from 'path';

const FEEDBACK_FILE = path.resolve(__dirname, '..', '..', '..', 'data', 'feedback', 'feedback.json');

// 每次测试前清空反馈文件
beforeEach(() => {
  const dir = path.dirname(FEEDBACK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(FEEDBACK_FILE, '[]', 'utf8');
});

// ============================================================
// 反馈提交 POST /api/feedback
// ============================================================
describe('反馈提交 POST /api/feedback', () => {
  // 1. 完整反馈提交
  it('完整反馈可以成功提交', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        issue_type: '价格不符',
        description: '页面显示 12 元，窗口实际为 15 元',
        cafeteria_id: 'C001',
        window_id: 'W001',
        dish_id: 'D001',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('feedback_id');
    expect(res.body.data).toHaveProperty('status', 'pending');
    expect(res.body.data).toHaveProperty('created_at');
    const saved = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf8'));
    expect(saved.length).toBe(1);
    expect(saved[0].feedback_id).toBe(res.body.data.feedback_id);
    expect(saved[0].issue_type).toBe('价格不符');
    expect(saved[0].description).toBe('页面显示 12 元，窗口实际为 15 元');
    expect(saved[0].status).toBe('pending');
  });

  // 2. 缺少 issue_type
  it('缺少问题类型时返回 400', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ description: '测试反馈' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('问题类型');
  });

  // 3. 非法 issue_type
  it('使用非法问题类型时返回 400', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ issue_type: '非法类型', description: '测试反馈' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('非法问题类型');
  });

  // 4. 缺少 description
  it('缺少补充说明时返回 400', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ issue_type: '其他' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('补充说明');
  });

  // 5. description 为空字符串
  it('description 为空字符串返回 400', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ issue_type: '其他', description: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('补充说明');
  });

  // 6. description 超长
  it('description 超过 500 个字符时返回 400', async () => {
    const longDesc = 'x'.repeat(501);
    const res = await request(app)
      .post('/api/feedback')
      .send({ issue_type: '其他', description: longDesc });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('500');
  });

  // 7. 合法食堂关联
  it('合法食堂关联通过验证', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        issue_type: '菜品不存在',
        description: '食堂不存在此菜品',
        cafeteria_id: 'C001',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.feedback_id).toBeTruthy();
  });

  // 8. 不存在的食堂关联
  it('不存在的食堂关联时返回 400', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        issue_type: '菜品不存在',
        description: '食堂不存在',
        cafeteria_id: 'C999',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('食堂不存在');
  });

  // 9. 合法食堂-窗口-菜品关系
  it('合法食堂-窗口-菜品关系通过验证', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        issue_type: '价格不符',
        description: '价格显示问题',
        cafeteria_id: 'C001',
        window_id: 'W001',
        dish_id: 'D001',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  // 10. 窗口不属于食堂
  it('窗口不属于食堂时返回 400', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        issue_type: '价格不符',
        description: '关系错误',
        cafeteria_id: 'C001',
        window_id: 'W004',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('不属于');
  });

  // 11. 菜品不属于窗口
  it('菜品不属于窗口时返回 400', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        issue_type: '价格不符',
        description: '关系错误',
        window_id: 'W001',
        dish_id: 'D010',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('不属于');
  });

  // 12. 菜品不属于食堂
  it('菜品不属于食堂时返回 400', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        issue_type: '价格不符',
        description: '关系错误',
        cafeteria_id: 'C001',
        dish_id: 'D020',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('不属于');
  });

  // 13. 默认 pending
  it('默认状态为 pending', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ issue_type: '其他', description: '测试 pending' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
  });

  // 14. 反馈编号格式正确且唯一
  it('反馈编号格式正确且不重复', async () => {
    const res1 = await request(app)
      .post('/api/feedback')
      .send({ issue_type: '其他', description: '第一条' });
    expect(res1.body.data.feedback_id).toMatch(/^FB[a-z0-9]{8,15}$/);
    const res2 = await request(app)
      .post('/api/feedback')
      .send({ issue_type: '其他', description: '第二条' });
    expect(res2.body.data.feedback_id).toMatch(/^FB[a-z0-9]{8,15}$/);
    expect(res2.body.data.feedback_id).not.toBe(res1.body.data.feedback_id);
  });

  // 15. 不存在的窗口
  it('不存在的窗口关联时返回 400', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ issue_type: '其他', description: '窗口不存在', window_id: 'W999' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('窗口不存在');
  });

  // 16. 不存在的菜品
  it('不存在的菜品关联时返回 400', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ issue_type: '其他', description: '菜品不存在', dish_id: 'D999' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('菜品不存在');
  });
});
