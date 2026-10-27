const { fail } = require('../utils/response');

const ANONYMOUS_ID_PATTERN = /^anon_[A-Za-z0-9_-]{8,120}$/;

function getAnonymousId(req) {
  const value = req.get('X-Anonymous-Id') || req.body?.anonymous_id || req.query?.anonymous_id || '';
  return typeof value === 'string' ? value.trim() : '';
}

function validateAnonymousId(value) {
  return ANONYMOUS_ID_PATTERN.test(value);
}

function requireAnonymous(req, res, next) {
  const anonymousId = getAnonymousId(req);
  if (!validateAnonymousId(anonymousId)) {
    return fail(res, '请先建立匿名账号会话', 401);
  }
  req.anonymousId = anonymousId;
  next();
}

function optionalAnonymous(req, res, next) {
  const anonymousId = getAnonymousId(req);
  req.anonymousId = validateAnonymousId(anonymousId) ? anonymousId : null;
  next();
}

module.exports = { getAnonymousId, validateAnonymousId, requireAnonymous, optionalAnonymous };
