const path = require('path');
const fs = require('fs');
const { config } = require('../config');
const cloudbaseStore = require('./cloudbaseStore');

const useCloud = config.menuStorage === 'cloudbase' || config.adminStorage === 'cloudbase';
const versionsFile = path.resolve(config.dataDir, 'admin', 'menu-versions.json');
const logsFile = path.resolve(config.dataDir, 'admin', 'change-log.json');

function stripId(item) {
  const copy = { ...item };
  delete copy._id;
  return copy;
}

function readFile(file) {
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}

function writeFile(file, entries) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(entries, null, 2), 'utf8');
}

async function listVersions() {
  if (useCloud) return (await cloudbaseStore.list('menu_versions')).map(stripId);
  return readFile(versionsFile);
}

async function addVersion(version) {
  if (useCloud) return cloudbaseStore.add('menu_versions', version);
  const entries = readFile(versionsFile);
  entries.push(version);
  writeFile(versionsFile, entries);
  return { id: version.version_id };
}

async function listLogs() {
  if (useCloud) return (await cloudbaseStore.list('menu_change_logs')).map(stripId);
  return readFile(logsFile);
}

async function addLog(entry) {
  if (useCloud) return cloudbaseStore.add('menu_change_logs', entry);
  const entries = readFile(logsFile);
  entries.push(entry);
  writeFile(logsFile, entries);
  return { id: entry.change_id };
}

module.exports = { listVersions, addVersion, listLogs, addLog };
