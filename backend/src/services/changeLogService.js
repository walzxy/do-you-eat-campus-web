// Change-log 服务
// 每次管理操作记录变更日志，支持追溯和回滚参考
// 日志保存在 data/admin/change-log.json

const path = require('path');
const fs = require('fs');
const { config } = require('../config');

const LOG_DIR = path.resolve(config.dataDir, 'admin');
const LOG_FILE = path.resolve(LOG_DIR, 'change-log.json');

function _ensureDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function _readAll() {
  _ensureDir();
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function _writeAll(entries) {
  _ensureDir();
  fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

/**
 * 生成变更编号 CHGyyyymmddHHMMSS + 3位序号
 */
function _nextChangeId() {
  const now = new Date();
  const prefix = 'CHG' +
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const existing = _readAll();
  const samePrefix = existing.filter(e => e.change_id && e.change_id.startsWith(prefix));
  const seq = String(samePrefix.length + 1).padStart(3, '0');
  return prefix + seq;
}

/**
 * 记录一条变更日志
 * @param {Object} entry
 * @param {string} entry.operator - 操作人标识（当前固定 "admin"）
 * @param {string} entry.action - 操作类型（update_dish, create_dish, toggle_status, import_publish, rollback 等）
 * @param {string} entry.target_type - 目标类型（dish, feedback, version 等）
 * @param {string} entry.target_id - 目标 ID
 * @param {Object} entry.changes - 修改详情 { field: { before, after } }
 * @param {string} entry.reason - 修改原因
 * @param {string} [entry.data_version] - 关联的数据版本
 */
function log(entry) {
  const all = _readAll();
  const logEntry = {
    change_id: _nextChangeId(),
    operator: entry.operator || 'admin',
    action: entry.action,
    target_type: entry.target_type,
    target_id: entry.target_id,
    changes: entry.changes || {},
    reason: entry.reason || '',
    data_version: entry.data_version || null,
    created_at: new Date().toISOString(),
  };
  all.push(logEntry);
  _writeAll(all);
  return logEntry;
}

/**
 * 查询变更日志，支持分页
 */
function query({ page = 1, pageSize = 50, target_type, action } = {}) {
  let all = _readAll();
  if (target_type) {
    all = all.filter(e => e.target_type === target_type);
  }
  if (action) {
    all = all.filter(e => e.action === action);
  }
  // 倒序（最新的在前）
  all.reverse();
  const total = all.length;
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);
  return { items, total, page, pageSize };
}

module.exports = { log, query };