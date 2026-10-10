import { describe, it, expect } from 'vitest';
import { success, fail } from '../utils/response.js';

/**
 * 创建一个简易的 res 模拟对象，满足 response.js 的调用方式
 */
function createMockRes() {
  let _statusCode = 200;
  let _jsonBody = null;
  return {
    status(code) {
      _statusCode = code;
      return this;
    },
    json(body) {
      _jsonBody = body;
      _jsonBody.__statusCode = _statusCode;
      return this;
    },
    _getData() {
      return _jsonBody;
    },
  };
}

describe('统一响应格式 success()', () => {
  it('应返回 200 和 success: true', () => {
    const res = createMockRes();
    success(res, { status: 'ok' });
    const data = res._getData();
    expect(data.__statusCode).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({ status: 'ok' });
  });

  it('应支持自定义状态码', () => {
    const res = createMockRes();
    success(res, { id: 1 }, 201);
    const data = res._getData();
    expect(data.__statusCode).toBe(201);
  });

  it('data 为 null 时也应返回 success: true', () => {
    const res = createMockRes();
    success(res, null);
    const data = res._getData();
    expect(data.success).toBe(true);
    expect(data.data).toBeNull();
  });
});

describe('统一响应格式 fail()', () => {
  it('应返回 400 和 success: false', () => {
    const res = createMockRes();
    fail(res, '参数错误');
    const data = res._getData();
    expect(data.__statusCode).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.message).toBe('参数错误');
  });

  it('应支持自定义状态码', () => {
    const res = createMockRes();
    fail(res, '未找到', 404);
    const data = res._getData();
    expect(data.__statusCode).toBe(404);
  });

  it('应支持 details 字段', () => {
    const res = createMockRes();
    fail(res, '校验失败', 422, { field: 'price', reason: '不是数字' });
    const data = res._getData();
    expect(data.error.details).toEqual({ field: 'price', reason: '不是数字' });
  });

  it('不传 details 时不应有 details 字段', () => {
    const res = createMockRes();
    fail(res, '错误');
    const data = res._getData();
    expect(data.error.details).toBeUndefined();
  });
});