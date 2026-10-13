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
      const envId = process.env.ENV_ID || process.env.TCB_ENV;
      // 有 envId 时传入，无 envId 时由 SDK 自动检测环境
      // 避免传入 undefined 导致 INVALID_PARAMS 错误
      const app = envId ? cloudbase.init({ env: envId }) : cloudbase.init();
      this._db = app.database();
      this._collection = this._db.collection('feedback');
      this._initialized = true;
    } catch (err) {
      // 云数据库不可用时抛出让上层处理，不静默写本地
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
// 导出 store 对象，支持运行时切换（主要用于测试）
// ============================================================
const storageMode = config.feedbackStorage;

let _activeStore;
if (storageMode === 'cloudbase') {
  _activeStore = new CloudBaseFeedbackStore();
} else {
  _activeStore = new FileFeedbackStore();
}

const store = {
  findAll() { return _activeStore.findAll(...arguments); },
  findById(id) { return _activeStore.findById(id); },
  save(data) { return _activeStore.save(data); },
};

/**
 * 测试用：运行时替换存储后端（供测试直接注入 mock store）
 * 传入 null/undefined 恢复为默认后端。
 * Normal usage should never call this.
 */
function _setStoreForTest(mockStore) {
  if (mockStore) {
    _activeStore = mockStore;
  } else {
    // 恢复默认
    if (storageMode === 'cloudbase') {
      _activeStore = new CloudBaseFeedbackStore();
    } else {
      _activeStore = new FileFeedbackStore();
    }
  }
  // 更新代理方法
  store.findAll = function () { return _activeStore.findAll(...arguments); };
  store.findById = function (id) { return _activeStore.findById(id); };
  store.save = function (data) { return _activeStore.save(data); };
}

module.exports = store;
module.exports._setStoreForTest = _setStoreForTest;