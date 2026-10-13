'use strict';

const fs = require('fs');
const path = require('path');
const serverless = require('serverless-http');

const DATA_DIR = path.join(__dirname, '..', 'data', 'processed');
const REQUIRED_FILES = ['cafeterias.json', 'windows.json', 'dishes.json'];

/**
 * 验证所有数据文件在启动时完整可用
 * 不通过则直接抛错，确保网关返回 500
 */
function validateDataFiles() {
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(DATA_DIR, file);

    if (!fs.existsSync(filePath)) {
      throw new Error(`数据文件 ${file} 缺失，拒绝服务`);
    }

    let raw;
    try {
      raw = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      throw new Error(`读取数据文件 ${file} 失败: ${err.message}`);
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      throw new Error(`数据文件 ${file} 损坏，无法解析 JSON: ${err.message}`);
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`数据文件 ${file} 内容为空，拒绝回退到构造数据`);
    }
  }
}

// 初始化阶段校验数据完整性，失败则阻止函数启动
validateDataFiles();

// 加载 Express app，DATA_SOURCE 强制指向 processed 目录
process.env.DATA_SOURCE = DATA_DIR;
process.env.NODE_ENV = 'production';
// 云函数环境使用云数据库存储反馈
process.env.FEEDBACK_STORAGE = 'cloudbase';

const app = require('../backend/src/app');

/**
 * serverless-http 适配云函数网关事件 → Express 请求
 * 保持现有 /api/* 全部路由和响应契约
 */
const handler = serverless(app);

/**
 * 腾讯云函数入口
 */
exports.main_handler = async (event, context) => {
  return await handler(event, context);
};