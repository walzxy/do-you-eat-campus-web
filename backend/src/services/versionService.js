// 版本管理服务
// 每次发布（导入确认/批量编辑）前备份当前版本，支持回滚到上一版本
// 版本快照保存在 data/admin/versions/

const path = require('path');
const fs = require('fs');
const { config } = require('../config');

const VERSIONS_DIR = path.resolve(config.dataDir, 'admin', 'versions');
const META_FILE = path.resolve(VERSIONS_DIR, 'meta.json');

function _ensureDir() {
  if (!fs.existsSync(VERSIONS_DIR)) {
    fs.mkdirSync(VERSIONS_DIR, { recursive: true });
  }
}

function _readMeta() {
  _ensureDir();
  if (!fs.existsSync(META_FILE)) {
    return { current: null, previous: null, versions: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
  } catch {
    return { current: null, previous: null, versions: [] };
  }
}

function _writeMeta(meta) {
  _ensureDir();
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf8');
}

/**
 * 发布新版本
 * @param {string} reason - 发布原因
 * @param {string} operator - 操作人
 * @returns {Object} 版本信息
 */
function publish(reason, operator = 'admin') {
  _ensureDir();
  const meta = _readMeta();

  // 读取当前活跃数据
  const dataDir = config.activeDataDir;
  const collections = ['cafeterias.json', 'windows.json', 'dishes.json'];
  const snapshot = {};
  for (const file of collections) {
    const filePath = path.resolve(dataDir, file);
    if (fs.existsSync(filePath)) {
      snapshot[file] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  }

  // 生成版本 ID
  const now = new Date();
  const versionId = 'VER' +
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  // 保存快照文件
  const snapshotFile = path.resolve(VERSIONS_DIR, versionId + '.json');
  fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2), 'utf8');

  // 更新 meta
  const versionEntry = {
    version_id: versionId,
    created_at: now.toISOString(),
    reason: reason,
    operator: operator,
  };

  if (meta.current) {
    meta.previous = meta.current;
  }
  meta.current = versionEntry;
  meta.versions.push(versionEntry);
  // 只保留最近 10 个版本记录
  if (meta.versions.length > 10) {
    meta.versions = meta.versions.slice(-10);
  }
  _writeMeta(meta);

  return versionEntry;
}

/**
 * 回滚到上一版本
 * @returns {Object} { success, version_id, message }
 */
function rollback() {
  const meta = _readMeta();
  if (!meta.previous) {
    return { success: false, message: '没有可回滚的上一版本' };
  }

  const prevVersionId = meta.previous.version_id;
  const snapshotFile = path.resolve(VERSIONS_DIR, prevVersionId + '.json');
  if (!fs.existsSync(snapshotFile)) {
    return { success: false, message: '上一版本快照文件缺失: ' + prevVersionId };
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
  const dataDir = config.activeDataDir;

  // 先生成回滚版本 ID
  const now = new Date();
  const rollbackVersionId = 'RVB' +
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  // 1. 先把回滚前的当前版本备份（在覆盖之前）
  const currentSnapshot = {};
  const collections = Object.keys(snapshot);
  for (const file of collections) {
    const filePath = path.resolve(dataDir, file);
    if (fs.existsSync(filePath)) {
      currentSnapshot[file] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  }
  const currentSnapshotFile = path.resolve(VERSIONS_DIR, rollbackVersionId + '.json');
  fs.writeFileSync(currentSnapshotFile, JSON.stringify(currentSnapshot, null, 2), 'utf8');

  // 2. 再写回旧版本数据
  for (const [file, data] of Object.entries(snapshot)) {
    const filePath = path.resolve(dataDir, file);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  const rollbackEntry = {
    version_id: rollbackVersionId,
    created_at: now.toISOString(),
    reason: '回滚到版本 ' + prevVersionId,
    operator: 'admin',
    rollback_from: meta.current ? meta.current.version_id : null,
    rollback_to: prevVersionId,
  };

  meta.previous = meta.current;
  meta.current = rollbackEntry;
  meta.versions.push(rollbackEntry);
  if (meta.versions.length > 10) {
    meta.versions = meta.versions.slice(-10);
  }
  _writeMeta(meta);

  return { success: true, version_id: rollbackVersionId, message: '已回滚到版本 ' + prevVersionId };
}

/**
 * 获取版本信息
 */
function getInfo() {
  const meta = _readMeta();
  return {
    current: meta.current,
    previous: meta.previous,
    total_versions: meta.versions.length,
  };
}

module.exports = { publish, rollback, getInfo };