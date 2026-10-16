// 版本管理服务
// 支持 publishData（先备份旧数据→写入新数据→创建新版本）和 publish（仅创建当前数据的快照）
// 版本快照保存在 data/admin/versions/

const path = require("path");
const fs = require("fs");
const { config } = require("../config");

const VERSIONS_DIR = path.resolve(config.dataDir, "admin", "versions");
const META_FILE = path.resolve(VERSIONS_DIR, "meta.json");

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
    return JSON.parse(fs.readFileSync(META_FILE, "utf8"));
  } catch {
    return { current: null, previous: null, versions: [] };
  }
}

function _writeMeta(meta) {
  _ensureDir();
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), "utf8");
}

function _nextVersionId() {
  const now = new Date();
  const ts = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");
  const meta = _readMeta();
  const existing = new Set((meta.versions || []).map(v => v.version_id));
  let suffix = "";
  let counter = 1;
  while (existing.has("VER" + ts + suffix)) {
    suffix = "-" + String(counter++).padStart(3, "0");
  }
  return "VER" + ts + suffix;
}

function _readCurrentData() {
  const dataDir = config.activeDataDir;
  const collections = ["cafeterias.json", "windows.json", "dishes.json"];
  const data = {};
  for (const file of collections) {
    const filePath = path.resolve(dataDir, file);
    if (fs.existsSync(filePath)) {
      data[file] = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } else {
      data[file] = [];
    }
  }
  return data;
}

function _atomicReplace(nextData) {
  const os = require("os");
  const dataDir = config.activeDataDir;
  const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), "canteen-version-"));
  try {
    for (const [name, coll] of Object.entries(nextData)) {
      fs.writeFileSync(path.join(stagingDir, name), JSON.stringify(coll, null, 2), "utf8");
    }
    const backupDir = dataDir + ".backup-" + Date.now();
    let movedExisting = false;
    try {
      if (fs.existsSync(dataDir)) {
        fs.renameSync(dataDir, backupDir);
        movedExisting = true;
      }
      fs.renameSync(stagingDir, dataDir);
      if (movedExisting) fs.rmSync(backupDir, { recursive: true, force: true });
    } catch (renameErr) {
      if (fs.existsSync(dataDir)) fs.rmSync(dataDir, { recursive: true, force: true });
      if (movedExisting && fs.existsSync(backupDir)) fs.renameSync(backupDir, dataDir);
      throw renameErr;
    }
  } catch (err) {
    if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
    throw err;
  }
}

/**
 * 发布新数据版本（备份旧数据 → 写入新数据 → 创建版本记录）
 * @param {Object} nextData - { "cafeterias.json": [], "windows.json": [], "dishes.json": [] }
 * @param {string} reason
 * @param {string} [operator="admin"]
 * @returns {Object} 版本信息
 */
function publishData(nextData, reason, operator = "admin") {
  _ensureDir();
  const meta = _readMeta();
  const currentData = _readCurrentData();
  const previousVersionId = _nextVersionId();
  const prevSnapshotFile = path.resolve(VERSIONS_DIR, previousVersionId + ".json");
  fs.writeFileSync(prevSnapshotFile, JSON.stringify(currentData, null, 2), "utf8");
  _atomicReplace(nextData);
  const now = new Date();
  const versionEntry = {
    version_id: _nextVersionId(),
    created_at: now.toISOString(),
    reason: reason,
    operator: operator,
    previous_version_id: previousVersionId,
  };
  const newSnapshotFile = path.resolve(VERSIONS_DIR, versionEntry.version_id + ".json");
  fs.writeFileSync(newSnapshotFile, JSON.stringify(nextData, null, 2), "utf8");
  if (meta.current) {
    meta.previous = meta.current;
  }
  meta.current = versionEntry;
  meta.versions.push(versionEntry);
  if (meta.versions.length > 10) {
    meta.versions = meta.versions.slice(-10);
  }
  _writeMeta(meta);
  return versionEntry;
}

/**
 * 仅创建当前数据快照并记录版本（不改变数据）
 */
function publish(reason, operator = "admin") {
  _ensureDir();
  const meta = _readMeta();
  const currentData = _readCurrentData();
  const versionId = _nextVersionId();
  const snapshotFile = path.resolve(VERSIONS_DIR, versionId + ".json");
  fs.writeFileSync(snapshotFile, JSON.stringify(currentData, null, 2), "utf8");
  const now = new Date();
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
  if (meta.versions.length > 10) {
    meta.versions = meta.versions.slice(-10);
  }
  _writeMeta(meta);
  return versionEntry;
}

function rollback() {
  const meta = _readMeta();
  if (!meta.previous) {
    return { success: false, message: "没有可回滚的上一版本" };
  }
  const prevVersionId = meta.previous.version_id;
  const snapshotFile = path.resolve(VERSIONS_DIR, prevVersionId + ".json");
  if (!fs.existsSync(snapshotFile)) {
    return { success: false, message: "上一版本快照文件缺失: " + prevVersionId };
  }
  const snapshot = JSON.parse(fs.readFileSync(snapshotFile, "utf8"));
  const now = new Date();
  const rollbackVersionId = "RVB" +
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");
  const currentSnapshot = _readCurrentData();
  const currentSnapshotFile = path.resolve(VERSIONS_DIR, rollbackVersionId + ".json");
  fs.writeFileSync(currentSnapshotFile, JSON.stringify(currentSnapshot, null, 2), "utf8");
  _atomicReplace(snapshot);
  const rollbackEntry = {
    version_id: rollbackVersionId,
    created_at: now.toISOString(),
    reason: "回滚到版本 " + prevVersionId,
    operator: "admin",
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
  return { success: true, version_id: rollbackVersionId, message: "已回滚到版本 " + prevVersionId };
}

function getInfo() {
  const meta = _readMeta();
  return {
    current: meta.current,
    previous: meta.previous,
    total_versions: meta.versions.length,
  };
}

module.exports = { publish, publishData, rollback, getInfo };
