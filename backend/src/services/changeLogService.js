const auditRepository = require('../repositories/adminAuditRepository');

function nextChangeId(entries) {
  const now = new Date();
  const prefix = 'CHG' + now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const samePrefix = entries.filter(item => item.change_id && item.change_id.startsWith(prefix));
  return prefix + String(samePrefix.length + 1).padStart(3, '0');
}

async function log(entry) {
  const all = await auditRepository.listLogs();
  const logEntry = {
    change_id: nextChangeId(all),
    operator: entry.operator || 'admin',
    action: entry.action,
    target_type: entry.target_type,
    target_id: entry.target_id,
    changes: entry.changes || {},
    reason: entry.reason || '',
    data_version: entry.data_version || null,
    created_at: new Date().toISOString(),
  };
  await auditRepository.addLog(logEntry);
  return logEntry;
}

async function query({ page = 1, pageSize = 50, target_type, action } = {}) {
  let all = await auditRepository.listLogs();
  if (target_type) all = all.filter(item => item.target_type === target_type);
  if (action) all = all.filter(item => item.action === action);
  all.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const total = all.length;
  const start = (page - 1) * pageSize;
  return { items: all.slice(start, start + pageSize), total, page, pageSize };
}

module.exports = { log, query };
