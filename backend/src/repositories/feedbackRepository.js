/**
 * 反馈仓储 — 支持 file（本地 JSON）/ cloudbase（云开发数据库）双后端
 *
 * 环境变量 FEEDBACK_STORAGE 控制：
 *   file      — 写入 data/feedback/feedback.json（本地开发，默认）
 *   cloudbase — 写入云开发 feedback 集合（云函数生产环境）
 *
 * 反馈 ID 生成：FB + 时间戳 base36 + 4 位随机小写字母
 * 并发安全：不依赖数组长度或自增序号
 * 不收集：姓名、学号、手机号、IP 地址
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { config } = require('../config');

const FEEDBACK_DIR = path.resolve(__dirname, '..', '..', '..', 'data', 'feedback');
const FEEDBACK_FILE = path.join(FEEDBACK_DIR, 'feedback.json');

/**
 * 生成并发安全的反馈 ID
 * 格式：FB + 时间戳 base36（8~11 位）+ 4 位随机小写字母
 * 例：FBk8a3x2p0abqz
 */
function generateFeedbackId() {
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(2).readUInt16LE().toString(36).padStart(4, '0').slice(0, 4);
  return 'FB' + ts + rand;
}

// ============================================================
// File 后端 — 本地 JSON 文件存储
// ============================================================
class FileFeedbackStore {
  _ensureFile() {
    if (!fs.existsSync(FEEDBACK_DIR)) {
      fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
    }
    if (!fs.existsSync(FEEDBACK_FILE)) {
      fs.writeFileSync(FEEDBACK_FILE, '[]', 'utf8');
    }
  }

  _readAll() {
    this._ensureFile();
    const raw = fs.readFileSync(FEEDBACK_FILE, 'utf8');
    return JSON.parse(raw);
  }

  _writeAll(data) {
    this._ensureFile();
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2), 'utf8');
  }

  findAll() {
    return this._readAll();
  }

  findById(id) {
    const items = this._readAll();
    return items.find(item => item.feedback_id === id) || null;
  }

  save(feedbackData) {
    const items = this._readAll();
    const feedback = {
      feedback_id: generateFeedbackId(),
      issue_type: feedbackData.issue_type,
      description: feedbackData.description,
      cafeteria_id: feedbackData.cafeteria_id || null,
      window_id: feedbackData.window_id || null,
      dish_id: feedbackData.dish_id || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    items.push(feedback);
    this._writeAll(items);
    return feedback;
  }
}

// ============================================================
// CloudBase 后端 — 云开发数据库（feedback 集合）
// ============================================================
class CloudBaseFeedbackStore {
  constructor() {
    this._initialized = false;
    this._db = null;
  }

  _ensureInit() {
    if (this._initialized) return;
    try {
      const cloudbase = require('@cloudbase/node-sdk');
      const app = cloudbase.init({
        env: process.env.ENV_ID || process.env.TCB_ENV,
      });
      this._db = app.database();
      this._collection = this._db.collection('feedback');
      this._initialized = true;
    } catch (err) {
      // 云数据库不可用时降级：抛出让上层处理，不静默写本地
      throw new Error('CloudBase 数据库初始化失败: ' + err.message);
    }
  }

  async findAll() {
    this._ensureInit();
    const res = await this._collection.get();
    return res.data || [];
  }

  async findById(id) {
    this._ensureInit();
    const res = await this._collection.where({ feedback_id: id }).get();
    return (res.data && res.data.length > 0) ? res.data[0] : null;
  }

  async save(feedbackData) {
    this._ensureInit();
    const feedback = {
      feedback_id: generateFeedbackId(),
      issue_type: feedbackData.issue_type,
      description: feedbackData.description,
      cafeteria_id: feedbackData.cafeteria_id || null,
      window_id: feedbackData.window_id || null,
      dish_id: feedbackData.dish_id || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    await this._collection.add(feedback);
    return feedback;
  }
}

// ============================================================
// 统一导出 — 根据 FEEDBACK_STORAGE 选择后端
// ============================================================
const storageMode = config.feedbackStorage;

let store;
if (storageMode === 'cloudbase') {
  store = new CloudBaseFeedbackStore();
} else {
  store = new FileFeedbackStore();
}

module.exports = store;