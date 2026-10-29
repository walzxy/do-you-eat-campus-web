/*
 * 一次性迁移主数据到 CloudBase。
 *
 * 运行前提：已执行 tcb login，且目标集合为空。
 * 脚本拒绝覆盖非空集合，避免误删线上管理员已经录入的数据。
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const envId = process.env.CLOUDBASE_ENV_ID || 'doyeat-d0golk77lb63ff44e';
const root = path.resolve(__dirname, '..');
const collections = [
  ['cafeterias', 'cafeteria_id'],
  ['windows', 'window_id'],
  ['dishes', 'dish_id'],
];
function execute(commands) {
  const args = process.platform === 'win32'
    ? [path.join(process.env.APPDATA, 'npm', 'node_modules', '@cloudbase', 'cli', 'bin', 'tcb'), 'db', 'nosql', 'execute', '-e', envId, '--command', JSON.stringify(commands), '--json']
    : ['db', 'nosql', 'execute', '-e', envId, '--command', JSON.stringify(commands), '--json'];
  const executable = process.platform === 'win32' ? process.execPath : 'tcb';
  const result = spawnSync(executable, args, { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || result.error?.message || 'CloudBase command failed').trim());
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error('无法解析 CloudBase CLI 输出: ' + result.stdout);
  }
}

function numberFrom(value) {
  if (value && typeof value === 'object') {
    return Number(value.$numberInt || value.$numberLong || 0);
  }
  return Number(value || 0);
}

function countCollection(collection) {
  const response = execute([{
    TableName: collection,
    CommandType: 'COMMAND',
    Command: JSON.stringify({ count: collection }),
  }]);
  return numberFrom(response.data.results[0][0]?.n);
}

function insertChunk(collection, rows) {
  execute([{
    TableName: collection,
    CommandType: 'INSERT',
    Command: JSON.stringify({ insert: collection, documents: rows }),
  }]);
}

for (const [collection] of collections) {
  const count = countCollection(collection);
  if (count > 0) {
    throw new Error(`${collection} 已有 ${count} 条数据，脚本拒绝覆盖。`);
  }
}

for (const [collection] of collections) {
  const file = path.join(root, 'data', 'processed', collection + '.json');
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (let index = 0; index < rows.length; index += 10) {
    insertChunk(collection, rows.slice(index, index + 10));
    console.log(`${collection}: ${Math.min(index + 10, rows.length)}/${rows.length}`);
  }
}

for (const [collection] of collections) {
  console.log(`${collection} final count: ${countCollection(collection)}`);
}
