const { config } = require('../config');

function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log('[' + level + ']', method, url, res.statusCode, duration + 'ms');
  });

  next();
}

module.exports = requestLogger;

