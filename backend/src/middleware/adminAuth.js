// 管理认证中间件
// 使用固定口令 + 无状态签名 Token 的轻量认证方案。
// 口令和签名密钥存储于环境变量，禁止出现在前端代码或 Git 中。

const crypto = require('crypto');
const { config } = require('../config');
const { fail } = require('../utils/response');

// Token 有效期：24 小时
const TOKEN_TTL_SECONDS = 24 * 60 * 60;

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signingKey() {
  return Buffer.from(config.adminTokenSecret || '', 'utf8');
}

function sign(payloadPart) {
  return crypto.createHmac('sha256', signingKey()).update(payloadPart).digest('base64url');
}

function issueToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    v: 1,
    role: 'admin',
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
    jti: crypto.randomBytes(16).toString('hex'),
  };
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  return `${payloadPart}.${sign(payloadPart)}`;
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

  console.info('[ADMIN_AUTH] 登录成功');
  return { success: true, token: issueToken() };
}

/**
 * 验证无状态签名 Token。
 * Token 不依赖云函数实例内存，因此冷启动、扩容和重新部署不会自动使其失效。
 */
function verifyToken(token) {
  if (!token) return { valid: false, message: '未提供 Token' };
  if (!config.adminTokenSecret) return { valid: false, message: '管理系统未配置' };

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false, message: 'Token 无效或已过期' };

    const [payloadPart, receivedSignature] = parts;
    const expectedSignature = sign(payloadPart);
    const received = Buffer.from(receivedSignature, 'base64url');
    const expected = Buffer.from(expectedSignature, 'base64url');
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
      return { valid: false, message: 'Token 无效或已过期' };
    }

    const payload = JSON.parse(base64UrlDecode(payloadPart));
    const now = Math.floor(Date.now() / 1000);
    if (payload.v !== 1 || payload.role !== 'admin' || !Number.isFinite(payload.exp) || payload.exp <= now) {
      return { valid: false, message: 'Token 无效或已过期' };
    }

    return { valid: true, role: payload.role, expires_at: payload.exp * 1000 };
  } catch {
    return { valid: false, message: 'Token 无效或已过期' };
  }
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
  if (!result.valid) return fail(res, result.message || 'Token 无效', 401);

  req.admin = { role: result.role };
  next();
}

/**
 * 验证 Token 接口（供前端校验用）
 */
function verifyEndpoint(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return fail(res, '未授权', 401);

  const result = verifyToken(authHeader.slice(7));
  if (!result.valid) return fail(res, result.message || 'Token 无效', 401);

  const { success } = require('../utils/response');
  return success(res, { valid: true, role: result.role, expires_at: result.expires_at });
}

module.exports = { login, verifyToken, authMiddleware, verifyEndpoint };
