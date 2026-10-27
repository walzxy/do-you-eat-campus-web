'use strict';
const path = require('path');

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
process.env.DATA_SOURCE = process.env.DATA_SOURCE || path.join(__dirname, 'data', 'processed');
process.env.FEEDBACK_STORAGE = process.env.FEEDBACK_STORAGE || 'cloudbase';
process.env.SOCIAL_STORAGE = process.env.SOCIAL_STORAGE || 'cloudbase';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const serverless = require('serverless-http');
const app = require('./backend/src/app');
const handler = serverless(app);

// 网关会剥掉 /api 前缀，这里补回来再交给 Express
function withApiPrefix(event) {
  try {
    const p = event.path || (event.requestContext && event.requestContext.path);
    if (typeof p === 'string' && !p.startsWith('/api')) {
      event.path = '/api' + p;
      if (event.rawPath) event.rawPath = '/api' + event.rawPath;
      if (event.requestContext) event.requestContext.path = event.path;
    }
  } catch (e) {}
  return event;
}

exports.main = async (event, context) => handler(withApiPrefix(event), context);
