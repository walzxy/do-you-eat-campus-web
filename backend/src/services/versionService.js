const path = require('path');
const fs = require('fs');
const { config } = require('../config');
const auditRepository = require('../repositories/adminAuditRepository');
const cafeteriaRepository = require('../repositories/cafeteriaRepository');
const windowRepository = require('../repositories/windowRepository');
const dishRepository = require('../repositories/dishRepository');

const useCloud = config.menuStorage === 'cloudbase' || config.adminStorage === 'cloudbase';
const versionsDir = path.resolve(config.dataDir, 'admin', 'versions');
const metaFile = path.resolve(versionsDir, 'meta.json');

function makeVersionId(prefix = 'VER') {
  const now = new Date();
  return prefix + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0') +
    '-' + Math.random().toString(36).slice(2, 8);
}

function currentSnapshot() {
  return {
    'cafeterias.json': cafeteriaRepository.findAll(),
    'windows.json': windowRepository.findAll(),
    'dishes.json': dishRepository.findAll(),
  };
}

async function cloudPublish(snapshot, reason, operator = 'admin') {
  const versions = await auditRepository.listVersions();
  const previous = versions.slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0] || null;
  const entry = {
    version_id: makeVersionId(),
    created_at: new Date().toISOString(),
    reason,
    operator,
    previous_version_id: previous ? previous.version_id : null,
    snapshot,
  };
  await auditRepository.addVersion(entry);
  return entry;
}

function readMeta() {
  if (!fs.existsSync(metaFile)) return { current: null, previous: null, versions: [] };
  try { return JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch { return { current: null, previous: null, versions: [] }; }
}

function writeMeta(meta) {
  if (!fs.existsSync(versionsDir)) fs.mkdirSync(versionsDir, { recursive: true });
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf8');
}

function localSnapshot() {
  const data = {};
  for (const file of ['cafeterias.json', 'windows.json', 'dishes.json']) {
    const filePath = path.resolve(config.activeDataDir, file);
    data[file] = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
  }
  return data;
}

function localReplace(nextData) {
  const dataDir = config.activeDataDir;
  for (const [name, value] of Object.entries(nextData)) {
    fs.writeFileSync(path.resolve(dataDir, name), JSON.stringify(value, null, 2), 'utf8');
  }
}

async function publishData(nextData, reason, operator = 'admin') {
  if (useCloud) {
    const entry = await cloudPublish(nextData, reason, operator);
    await cafeteriaRepository.save(nextData['cafeterias.json'] || []);
    await windowRepository.save(nextData['windows.json'] || []);
    await dishRepository.save(nextData['dishes.json'] || []);
    return entry;
  }
  const meta = readMeta();
  const entry = { version_id: makeVersionId(), created_at: new Date().toISOString(), reason, operator, snapshot: nextData };
  localReplace(nextData);
  if (!fs.existsSync(versionsDir)) fs.mkdirSync(versionsDir, { recursive: true });
  fs.writeFileSync(path.resolve(versionsDir, entry.version_id + '.json'), JSON.stringify(nextData, null, 2), 'utf8');
  if (meta.current) meta.previous = meta.current;
  meta.current = entry;
  meta.versions = [...(meta.versions || []), entry].slice(-10);
  writeMeta(meta);
  return entry;
}

async function publish(reason, operator = 'admin') {
  if (useCloud) return cloudPublish(currentSnapshot(), reason, operator);
  return publishData(localSnapshot(), reason, operator);
}

async function rollback() {
  if (useCloud) {
    const versions = await auditRepository.listVersions();
    const ordered = versions.slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    if (ordered.length < 2) return { success: false, message: '没有可回滚的上一版本' };
    const previous = ordered[1];
    const snapshot = previous.snapshot || {};
    await cafeteriaRepository.save(snapshot['cafeterias.json'] || []);
    await windowRepository.save(snapshot['windows.json'] || []);
    await dishRepository.save(snapshot['dishes.json'] || []);
    const entry = await cloudPublish(currentSnapshot(), '回滚到版本 ' + previous.version_id, 'admin');
    return { success: true, version_id: entry.version_id, message: '已回滚到版本 ' + previous.version_id };
  }
  const meta = readMeta();
  if (!meta.previous) return { success: false, message: '没有可回滚的上一版本' };
  const file = path.resolve(versionsDir, meta.previous.version_id + '.json');
  if (!fs.existsSync(file)) return { success: false, message: '上一版本快照文件缺失: ' + meta.previous.version_id };
  const snapshot = JSON.parse(fs.readFileSync(file, 'utf8'));
  localReplace(snapshot);
  const previousId = meta.previous.version_id;
  const entry = { version_id: makeVersionId('RVB'), created_at: new Date().toISOString(), reason: '回滚到版本 ' + previousId, operator: 'admin' };
  meta.previous = meta.current;
  meta.current = entry;
  meta.versions = [...(meta.versions || []), entry].slice(-10);
  writeMeta(meta);
  return { success: true, version_id: entry.version_id, message: '已回滚到版本 ' + previousId };
}

async function getInfo() {
  if (useCloud) {
    const versions = (await auditRepository.listVersions()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { current: versions[0] || null, previous: versions[1] || null, total_versions: versions.length };
  }
  const meta = readMeta();
  return { current: meta.current, previous: meta.previous, total_versions: (meta.versions || []).length };
}

module.exports = { publish, publishData, rollback, getInfo };
