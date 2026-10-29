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
  // 反馈存储后端：file（本地 JSON 文件）| cloudbase（云开发数据库）
  // 本地开发默认 file，云函数环境设为 cloudbase
  feedbackStorage: process.env.FEEDBACK_STORAGE || 'file',
  // 账号、饭录、社区内容存储后端：file（本地 JSON）| cloudbase（云开发数据库）
  socialStorage: process.env.SOCIAL_STORAGE || 'file',
  // 食堂、窗口、菜品主数据存储后端：file（本地 JSON）| cloudbase（云开发数据库）
  menuStorage: process.env.MENU_STORAGE || 'file',
  // 管理口令：从环境变量读取，禁止写入前端代码或 Git
  adminPassword: process.env.ADMIN_PASSWORD || '',
};

module.exports = { config };

