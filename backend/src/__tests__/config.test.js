import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';

describe('配置 - 数据目录默认值', () => {
  // 从测试文件位置推导项目根目录
  // config.test.js 在 backend/src/__tests__/，向上 1 层到 src，再向上到 config
  const CONFIG_DIR = path.resolve(__dirname, '..', 'config');
  const PROJECT_ROOT = path.resolve(CONFIG_DIR, '..', '..', '..');
  const SAMPLE_DIR = path.resolve(PROJECT_ROOT, 'data', 'sample');
  const PROCESSED_DIR = path.resolve(PROJECT_ROOT, 'data', 'processed');

  it('开发环境（NODE_ENV 未设置）默认读取 sample/', () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origDataSource = process.env.DATA_SOURCE;
    delete process.env.NODE_ENV;
    delete process.env.DATA_SOURCE;

    // 清除模块缓存，重新加载
    const configPath = require.resolve('../config/index.js');
    delete require.cache[configPath];
    const { config } = require('../config/index.js');

    expect(config.activeDataDir).toBe(SAMPLE_DIR);

    if (origNodeEnv) process.env.NODE_ENV = origNodeEnv;
    if (origDataSource) process.env.DATA_SOURCE = origDataSource;
  });

  it('生产环境（NODE_ENV=production）默认读取 processed/', () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origDataSource = process.env.DATA_SOURCE;
    process.env.NODE_ENV = 'production';
    delete process.env.DATA_SOURCE;

    const configPath = require.resolve('../config/index.js');
    delete require.cache[configPath];
    const { config } = require('../config/index.js');

    expect(config.activeDataDir).toBe(PROCESSED_DIR);

    if (origNodeEnv) process.env.NODE_ENV = origNodeEnv;
    if (origDataSource) process.env.DATA_SOURCE = origDataSource;
  });

  it('设置 DATA_SOURCE 环境变量可覆盖默认路径', () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origDataSource = process.env.DATA_SOURCE;
    process.env.NODE_ENV = 'production';
    process.env.DATA_SOURCE = '/custom/data/path';

    const configPath = require.resolve('../config/index.js');
    delete require.cache[configPath];
    const { config } = require('../config/index.js');

    expect(config.activeDataDir).toBe('/custom/data/path');

    if (origNodeEnv) process.env.NODE_ENV = origNodeEnv;
    if (origDataSource) process.env.DATA_SOURCE = origDataSource;
  });
});