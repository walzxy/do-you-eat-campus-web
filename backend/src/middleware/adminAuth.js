// 管理认证中间件
// 使用固定口令 + 短期 Token 的轻量认证方案
// 口令存储于环境变量 ADMIN_PASSWORD，禁止出现在任何前端代码或 Git 中

const crypto = require('crypto');
const { config } = require('../config');
const { fail } = require('../utils/response');

// Token 有效期：24 小时
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// 内存 Token 存储（单实例，云函数冷启动后为空，需要重新登录）
const _tokens = new Map();

/**
 * 清理过期 Token
 */
function _cleanExpired() {
  const now = Date.now();
  for (const [token, entry] of _tokens) {
    if (entry.expires_at <= now) {
      _tokens.delete(token);
    }
  }
}

/**
 * 生成随机 Token
 */
function _generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 验证口令并签发 Token
 * @param {string} password
 * @returns {{ success: boolean, token?: string, message?: string }}
 */
function login(password) {
  if (!config.adminPassword) {
    console.error('[ADMIN_AUTH] ADMIN_PASSWORD 环境变量未设置，拒绝所有登录');
    return { success: false, message: '管理系统未配置' };
  }

  if (password !== config.adminPassword) {
    console.warn('[ADMIN_AUTH] 登录失败（口令错误）');
    return { success: false, message: '口令错误' };
  }

  _cleanExpired();
  const token = _generateToken();
  _tokens.set(token, {
    token,
    role: 'admin',
    created_at: Date.now(),
    expires_at: Date.now() + TOKEN_TTL_MS,
  });

  console.info('[ADMIN_AUTH] 登录成功');
  return { success: true, token };
}

/**
 * 验证 Token 有效性
 * @param {string} token
 * @returns {{ valid: boolean, role?: string, message?: string }}
 */
function verifyToken(token) {
  if (!token) {
    return { valid: false, message: '未提供 Token' };
  }

  _cleanExpired();
  const entry = _tokens.get(token);
  if (!entry) {
    return { valid: false, message: 'Token 无效或已过期' };
  }

  return { valid: true, role: entry.role };
}

/**
 * Express 认证中间件
 * 从 Authorization header 提取 Bearer Token
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, '未授权访问，请先登录', 401);
  }

  const token = authHeader.slice(7);
  const result = verifyToken(token);
  if (!result.valid) {
    return fail(res, result.message || 'Token 无效', 401);
  }

  req.admin = { role: result.role };
  next();
}

/**
 * 验证 Token 接口（供前端校验用）
 */
function verifyEndpoint(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, '未授权', 401);
  }
  const token = authHeader.slice(7);
  const result = verifyToken(token);
  if (!result.valid) {
    return fail(res, result.message || 'Token 无效', 401);
  }
  const { success } = require('../utils/response');
  return success(res, { valid: true, role: result.role });
}

module.exports = { login, verifyToken, authMiddleware, verifyEndpoint };