const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const dataDir = process.env.DATA_DIR || path.resolve(__dirname, '..', '..', '..', 'data');
const processedDir = path.resolve(dataDir, 'processed');
const sampleDir = path.resolve(dataDir, 'sample');

// 明确的环境判定：开发环境默认 sample，生产环境默认 processed
const isDev = (process.env.NODE_ENV || 'development') !== 'production';
const defaultDataDir = isDev ? sampleDir : processedDir;

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  dataDir: dataDir,
  // 开发期从 sample 目录读取构造数据，生产环境使用 processed 目录
  // 明确设置 DATA_SOURCE 环境变量可覆盖默认路径
  activeDataDir: process.env.DATA_SOURCE || defaultDataDir,
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = { config };

