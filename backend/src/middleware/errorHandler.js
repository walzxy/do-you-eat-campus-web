const { config } = require('../config');

function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message);
  if (err.stack) console.error('[ERROR] Stack:', err.stack);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: config.nodeEnv === 'development' ? err.message : 'Internal Server Error',
      ...(config.nodeEnv === 'development' && err.details ? { details: err.details } : {}),
    },
  });
}

module.exports = errorHandler;

