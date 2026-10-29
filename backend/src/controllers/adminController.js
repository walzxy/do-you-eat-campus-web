// 管理端控制器 — 认证、菜品管理、反馈管理、导入发布、版本管理
const { success, fail } = require('../utils/response');
const adminAuth = require('../middleware/adminAuth');
const dishRepository = require('../repositories/dishRepository');
const cafeteriaRepository = require('../repositories/cafeteriaRepository');
const windowRepository = require('../repositories/windowRepository');
const feedbackRepository = require('../repositories/feedbackRepository');
const changeLogService = require('../services/changeLogService');
const versionService = require('../services/versionService');
const excelImportService = require('../services/excelImportService');

// ============================================================
// 认证
// ============================================================

// POST /api/admin/login
function login(req, res) {
  const { password } = req.body;
  if (!password) {
    return fail(res, '请输入管理口令', 400);
  }
  const result = adminAuth.login(password);
  if (!result.success) {
    return fail(res, result.message || '口令错误', 401);
  }
  return success(res, { token: result.token });
}

// GET /api/admin/verify
function verify(req, res) {
  return adminAuth.verifyEndpoint(req, res);
}

// ============================================================
// 菜品管理
// ============================================================

// GET /api/admin/dishes
async function listDishes(req, res) {
  const { keyword } = req.query;
  let dishes;
  if (keyword && keyword.trim()) {
    dishes = dishRepository.searchByKeyword(keyword.trim());
  } else {
    dishes = dishRepository.findAll();
  }
  return success(res, { data: dishes, total: dishes.length });
}

// GET /api/admin/dishes/:dishId
async function getDish(req, res) {
  const { dishId } = req.params;
  const dish = dishRepository.findById(dishId);
  if (!dish) return fail(res, '菜品不存在: ' + dishId, 404);
  const cafeteria = cafeteriaRepository.findById(dish.cafeteria_id);
  const window = windowRepository.findById(dish.window_id);
  return success(res, {
    ...dish,
    cafeteria_name: cafeteria ? cafeteria.cafeteria_name : null,
    window_name: window ? window.window_name : null,
  });
}

// PUT /api/admin/dishes/:dishId
async function updateDish(req, res) {
  const { dishId } = req.params;
  const dish = dishRepository.findById(dishId);
  if (!dish) return fail(res, '菜品不存在: ' + dishId, 404);

  const { dish_name, keywords, price_min, price_max, category_major, category_minor, flavor, is_packable } = req.body;

  // 字段类型校验
  if (dish_name !== undefined && (typeof dish_name !== 'string' || dish_name.trim() === '')) {
    return fail(res, '菜品名称不能为空', 400);
  }
  if (keywords !== undefined && typeof keywords !== 'string') {
    return fail(res, '关键词必须是字符串', 400);
  }
  if (category_major !== undefined && typeof category_major !== 'string') {
    return fail(res, '主分类必须是字符串', 400);
  }
  if (category_minor !== undefined && typeof category_minor !== 'string') {
    return fail(res, '子分类必须是字符串', 400);
  }
  if (flavor !== undefined && typeof flavor !== 'string') {
    return fail(res, '口味必须是字符串', 400);
  }
  if (is_packable !== undefined && !['是', '否', '未知'].includes(is_packable)) {
    return fail(res, '打包状态无效', 400);
  }

  const pMin = price_min !== undefined ? Number(price_min) : dish.price_min;
  const pMax = price_max !== undefined ? Number(price_max) : dish.price_max;
  if (price_min !== undefined && (isNaN(pMin) || pMin < 0)) return fail(res, '最低价格必须是非负数字', 400);
  if (price_max !== undefined && (isNaN(pMax) || pMax < 0)) return fail(res, '最高价格必须是非负数字', 400);
  if ((price_min !== undefined || price_max !== undefined) && pMin > pMax) return fail(res, '最低价格不能高于最高价格', 400);

  const changes = {};
  if (dish_name !== undefined && dish_name !== dish.dish_name) changes.dish_name = { before: dish.dish_name, after: dish_name };
  if (keywords !== undefined && keywords !== dish.keywords) changes.keywords = { before: dish.keywords, after: keywords };
  if (price_min !== undefined && Number(price_min) !== dish.price_min) changes.price_min = { before: dish.price_min, after: Number(price_min) };
  if (price_max !== undefined && Number(price_max) !== dish.price_max) changes.price_max = { before: dish.price_max, after: Number(price_max) };
  if (category_major !== undefined && category_major !== dish.category_major) changes.category_major = { before: dish.category_major, after: category_major };
  if (category_minor !== undefined && category_minor !== dish.category_minor) changes.category_minor = { before: dish.category_minor, after: category_minor };
  if (flavor !== undefined && flavor !== dish.flavor) changes.flavor = { before: dish.flavor, after: flavor };
  if (is_packable !== undefined && is_packable !== dish.is_packable) changes.is_packable = { before: dish.is_packable, after: is_packable };

  if (Object.keys(changes).length === 0) return fail(res, '没有需要修改的字段', 400);

  const all = dishRepository.findAll();
  const index = all.findIndex(d => d.dish_id === dishId);
  if (index === -1) return fail(res, '菜品不存在', 404);

  // 先做版本快照（备份修改前的数据），再写入修改
  versionService.publish('编辑菜品: ' + (all[index].dish_name || dishId), 'admin');

  if (dish_name !== undefined) all[index].dish_name = dish_name;
  if (keywords !== undefined) all[index].keywords = keywords;
  if (price_min !== undefined) all[index].price_min = Number(price_min);
  if (price_max !== undefined) all[index].price_max = Number(price_max);
  if (category_major !== undefined) all[index].category_major = category_major;
  if (category_minor !== undefined) all[index].category_minor = category_minor;
  if (flavor !== undefined) all[index].flavor = flavor;
  if (is_packable !== undefined) all[index].is_packable = is_packable;

  await dishRepository.save(all);

  changeLogService.log({ operator: 'admin', action: 'update_dish', target_type: 'dish', target_id: dishId, changes, reason: req.body.reason || '' });

  return success(res, { dish_id: dishId, changes });
}

// POST /api/admin/dishes
async function createDish(req, res) {
  const { dish_name, keywords, cafeteria_id, window_id, price_min, price_max, flavor, category_major, category_minor, is_packable, availability_status } = req.body;

  if (!dish_name || typeof dish_name !== 'string' || dish_name.trim() === '') return fail(res, '菜品名称不能为空', 400);
  if (!cafeteria_id) return fail(res, '请选择所属食堂', 400);
  if (!window_id) return fail(res, '请选择所属窗口', 400);

  const cafeteria = cafeteriaRepository.findById(cafeteria_id);
  if (!cafeteria) return fail(res, '食堂不存在: ' + cafeteria_id, 400);
  const win = windowRepository.findById(window_id);
  if (!win) return fail(res, '窗口不存在: ' + window_id, 400);
  if (win.cafeteria_id !== cafeteria_id) return fail(res, '窗口不属于该食堂', 400);

  const pMin = Number(price_min);
  const pMax = Number(price_max);
  if (isNaN(pMin) || pMin < 0) return fail(res, '最低价格必须是非负数字', 400);
  if (price_max !== undefined && price_max !== null && price_max !== '' && (isNaN(pMax) || pMax < 0)) return fail(res, '最高价格必须是非负数字', 400);
  if (pMin > pMax) return fail(res, '最低价格不能高于最高价格', 400);

  const all = dishRepository.findAll();
  let maxNum = 0;
  for (const d of all) {
    const m = d.dish_id && d.dish_id.match(/^D(\d+)$/);
    if (m) { const n = parseInt(m[1], 10); if (n > maxNum) maxNum = n; }
  }
  const nextId = 'D' + String(maxNum + 1).padStart(3, '0');
  if (dishRepository.findById(nextId)) return fail(res, 'ID 生成冲突', 500);

  const newDish = {
    dish_id: nextId, dish_name: dish_name.trim(), keywords: keywords || '',
    cafeteria_id, window_id, price_min: pMin,
    price_max: price_max !== undefined && price_max !== null && price_max !== '' ? pMax : 0,
    flavor: flavor || '', category_major: category_major || '', category_minor: category_minor || '',
    is_packable: is_packable || '未知', availability_status: availability_status || '已核实售卖',
    source: 'manual', last_verified_date: new Date().toISOString().split('T')[0],
  };

  all.push(newDish);

  // 先做版本快照（备份新增前的数据），再写入新增数据
  versionService.publish('新增菜品: ' + newDish.dish_name, 'admin');

  await dishRepository.save(all);
  changeLogService.log({ operator: 'admin', action: 'create_dish', target_type: 'dish', target_id: nextId, changes: { _new: newDish }, reason: req.body.reason || '新增菜品' });
  return success(res, newDish, 201);
}
// POST /api/admin/dishes/:dishId/copy
async function copyDish(req, res) {
  const { dishId } = req.params;
  const source = dishRepository.findById(dishId);
  if (!source) return fail(res, '源菜品不存在: ' + dishId, 404);

  const { dish_name, price_min, price_max, keywords, reason } = req.body;
  if (!dish_name || typeof dish_name !== 'string' || dish_name.trim() === '') return fail(res, '新菜品名称不能为空', 400);

  const pMin = price_min !== undefined ? Number(price_min) : source.price_min;
  const pMax = price_max !== undefined ? Number(price_max) : source.price_max;
  if (isNaN(pMin) || pMin < 0 || isNaN(pMax) || pMax < 0) return fail(res, '价格必须是非负数字', 400);
  if (pMin > pMax) return fail(res, '最低价格不能高于最高价格', 400);

  const all = dishRepository.findAll();
  let maxNum = 0;
  for (const d of all) {
    const m = d.dish_id && d.dish_id.match(/^D(\d+)$/);
    if (m) { const n = parseInt(m[1], 10); if (n > maxNum) maxNum = n; }
  }
  const nextId = 'D' + String(maxNum + 1).padStart(3, '0');
  if (dishRepository.findById(nextId)) return fail(res, 'ID 生成冲突', 500);

  const newDish = {
    dish_id: nextId, dish_name: dish_name.trim(), keywords: keywords !== undefined ? keywords : source.keywords,
    cafeteria_id: source.cafeteria_id, window_id: source.window_id, price_min: pMin, price_max: pMax,
    flavor: source.flavor, category_major: source.category_major, category_minor: source.category_minor,
    is_packable: source.is_packable, availability_status: source.availability_status,
    source: 'manual_copy', last_verified_date: new Date().toISOString().split('T')[0],
  };

  all.push(newDish);
  // 先做版本快照（备份新增前的数据），再写入新增数据
  versionService.publish('复制新增: ' + newDish.dish_name, 'admin');
  await dishRepository.save(all);
  changeLogService.log({ operator: 'admin', action: 'create_dish', target_type: 'dish', target_id: nextId, changes: { _new: newDish, _copied_from: dishId }, reason: reason || '复制新增' });
  return success(res, newDish, 201);
}

// PATCH /api/admin/dishes/:dishId/status
async function toggleDishStatus(req, res) {
  const { dishId } = req.params;
  const dish = dishRepository.findById(dishId);
  if (!dish) return fail(res, '菜品不存在', 404);

  const { status, reason } = req.body;
  const VALID_STATUSES = ['已核实售卖', '菜单记录，未核实', '可能售卖', '暂时未售卖'];
  if (!status || !VALID_STATUSES.includes(status)) return fail(res, '目标状态无效', 400);
  if (dish.availability_status === status) return fail(res, '菜品已经是 ' + status + ' 状态', 400);

  const all = dishRepository.findAll();
  const index = all.findIndex(d => d.dish_id === dishId);
  if (index === -1) return fail(res, '菜品不存在', 404);

  const oldStatus = all[index].availability_status;

  // 先做版本快照（备份修改前的数据），再写入修改
  versionService.publish('菜品 ' + (status === '暂时未售卖' ? '下架' : '恢复供应') + ': ' + all[index].dish_name, 'admin');

  all[index].availability_status = status;
  await dishRepository.save(all);

  changeLogService.log({ operator: 'admin', action: 'toggle_status', target_type: 'dish', target_id: dishId, changes: { availability_status: { before: oldStatus, after: status } }, reason: reason || (status === '暂时未售卖' ? '下架' : '恢复供应') });

  return success(res, { dish_id: dishId, old_status: oldStatus, new_status: status });
}
// ============================================================
// 反馈管理
// ============================================================

const FEEDBACK_STATUSES = ['pending', 'processing', 'resolved', 'ignored'];

async function listFeedbacks(req, res) {
  try {
    const items = await feedbackRepository.findAll();
    const { status, page = '1', pageSize = '50' } = req.query;
    let filtered = Array.isArray(items) ? items : [];
    if (status && FEEDBACK_STATUSES.includes(status)) filtered = filtered.filter(f => f.status === status);
    filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const total = filtered.length;
    const p = parseInt(page, 10) || 1;
    const ps = parseInt(pageSize, 10) || 50;
    const start = (p - 1) * ps;
    const data = filtered.slice(start, start + ps).map(f => ({
      ...f,
      cafeteria_name: f.cafeteria_id ? (cafeteriaRepository.findById(f.cafeteria_id) || {}).cafeteria_name : null,
      window_name: f.window_id ? (windowRepository.findById(f.window_id) || {}).window_name : null,
      dish_name: f.dish_id ? (dishRepository.findById(f.dish_id) || {}).dish_name : null,
    }));
    return success(res, { data, total, page: p, pageSize: ps });
  } catch (e) {
    return fail(res, '查询反馈失败', 500);
  }
}

async function updateFeedbackStatus(req, res) {
  const { feedbackId } = req.params;
  const { status, reason } = req.body;
  if (!status || !FEEDBACK_STATUSES.includes(status)) return fail(res, '状态无效', 400);
  try {
    const result = await feedbackRepository.updateStatus(feedbackId, status);
    if (!result) return fail(res, '反馈不存在', 404);
    changeLogService.log({ operator: 'admin', action: 'update_feedback_status', target_type: 'feedback', target_id: feedbackId, changes: { status: { before: result.old_status, after: status } }, reason: reason || '' });
    return success(res, { feedback_id: feedbackId, old_status: result.old_status, new_status: status });
  } catch (e) {
    return fail(res, '保存失败', 500);
  }
}

// ============================================================
// Excel 导入
// ============================================================

function importPreview(req, res) {
  if (!req.file) return fail(res, '请上传 Excel 文件', 400);
  try {
    const result = excelImportService.parseBuffer(req.file.buffer);
    return success(res, result);
  } catch (err) {
    return fail(res, '导入解析失败: ' + err.message, 400);
  }
}

async function importConfirm(req, res) {
  const { data, reason } = req.body;
  if (!data || !data.cafeterias || !data.windows || !data.dishes) return fail(res, '数据不完整', 400);

  // 复用统一校验：ID 格式、重复 ID、必填字段、级联关系、schema 约束
  const { validateDishRow } = require('../schemas/dishSchema');

  const cafeteriaIds = new Set(data.cafeterias.map(c => c.cafeteria_id));
  for (const c of data.cafeterias) {
    if (!c.cafeteria_id || !/^C\d{3}$/.test(c.cafeteria_id)) return fail(res, '食堂编号格式无效: ' + (c.cafeteria_name || c.cafeteria_id), 400);
    if (!c.cafeteria_name) return fail(res, '食堂名称不能为空', 400);
  }
  const seenCafeteria = new Set();
  for (const c of data.cafeterias) {
    if (seenCafeteria.has(c.cafeteria_id)) return fail(res, '食堂编号重复: ' + c.cafeteria_id, 400);
    seenCafeteria.add(c.cafeteria_id);
  }

  for (const w of data.windows) {
    if (!w.window_id || !/^W\d{3}$/.test(w.window_id)) return fail(res, '窗口编号格式无效: ' + (w.window_name || w.window_id), 400);
    if (!w.cafeteria_id || !cafeteriaIds.has(w.cafeteria_id)) return fail(res, '窗口 ' + (w.window_name || w.window_id) + ' 关联的食堂不存在', 400);
    if (!w.window_name) return fail(res, '窗口名称不能为空', 400);
  }
  const seenWindow = new Set();
  for (const w of data.windows) {
    if (seenWindow.has(w.window_id)) return fail(res, '窗口编号重复: ' + w.window_id, 400);
    seenWindow.add(w.window_id);
  }

  const windowIds = {};
  for (const w of data.windows) {
    if (!windowIds[w.cafeteria_id]) windowIds[w.cafeteria_id] = new Set();
    windowIds[w.cafeteria_id].add(w.window_id);
  }

  const dishErrors = [];
  for (const d of data.dishes) {
    if (!d.dish_id || !/^D\d{3}$/.test(d.dish_id)) return fail(res, '菜品编号格式无效: ' + (d.dish_name || d.dish_id), 400);
    if (!d.dish_name || typeof d.dish_name !== 'string') return fail(res, '菜品缺少有效 dish_name', 400);
    if (!d.window_id || !d.cafeteria_id) return fail(res, '菜品 ' + d.dish_name + ' 缺少食堂/窗口关联', 400);
    if (!cafeteriaIds.has(d.cafeteria_id)) return fail(res, '菜品 ' + d.dish_name + ' 关联的食堂不存在', 400);
    if (!windowIds[d.cafeteria_id] || !windowIds[d.cafeteria_id].has(d.window_id)) return fail(res, '菜品 ' + d.dish_name + ' 关联的窗口不存在', 400);

    // 复用 dishSchema 的 validateDishRow 做完整约束校验
    const schemaErrors = validateDishRow(d);
    if (schemaErrors.length > 0) {
      dishErrors.push('菜品 ' + (d.dish_name || d.dish_id) + ': ' + schemaErrors.join('; '));
    }
  }
  if (dishErrors.length > 0) return fail(res, '菜品数据校验不通过: ' + dishErrors.join(' | '), 400);

  const seenDish = new Set();
  for (const d of data.dishes) {
    if (seenDish.has(d.dish_id)) return fail(res, '菜品编号重复: ' + d.dish_id, 400);
    seenDish.add(d.dish_id);
  }

  // 先创建旧数据版本快照，再写入新数据
  versionService.publish(reason || 'Excel 导入更新[旧数据备份]', 'admin');
  try {
    await cafeteriaRepository.save(data.cafeterias);
    await windowRepository.save(data.windows);
    await dishRepository.save(data.dishes);

    const versionEntry = versionService.publish(reason || 'Excel 导入更新', 'admin');
    changeLogService.log({ operator: 'admin', action: 'import_publish', target_type: 'data', target_id: 'all', changes: { _import: { cafeteria_count: data.cafeterias.length, windows_count: data.windows.length, dishes_count: data.dishes.length } }, reason: reason || 'Excel 导入发布', data_version: versionEntry.version_id });
    return success(res, { message: '导入发布成功', version: versionEntry });
  } catch (err) {
    return fail(res, '导入发布失败: ' + err.message, 500);
  }
}

// ============================================================
// 版本管理
// ============================================================

function getVersions(req, res) { return success(res, versionService.getInfo()); }

function rollbackVersion(req, res) {
  const { reason } = req.body;
  const result = versionService.rollback();
  if (!result.success) return fail(res, result.message, 400);
  changeLogService.log({ operator: 'admin', action: 'rollback', target_type: 'version', target_id: result.version_id, changes: { _rollback: result.message }, reason: reason || '回滚' });
  return success(res, result);
}

function getChangeLog(req, res) {
  const { page, pageSize, target_type, action } = req.query;
  return success(res, changeLogService.query({ page: parseInt(page, 10) || 1, pageSize: parseInt(pageSize, 10) || 50, target_type: target_type || undefined, action: action || undefined }));
}

// ============================================================
// 辅助
// ============================================================

async function listCafeterias(req, res) { const data = cafeteriaRepository.findAll(); return success(res, { data, total: data.length }); }

async function listWindowsByCafeteria(req, res) { const data = windowRepository.findByCafeteriaId(req.params.cafeteriaId); return success(res, { data, total: data.length }); }

function getStatusOptions(req, res) { return success(res, { dish_statuses: ['已核实售卖', '菜单记录，未核实', '可能售卖', '暂时未售卖'], feedback_statuses: FEEDBACK_STATUSES }); }
module.exports = {
  login, verify,
  listDishes, getDish, updateDish, createDish, copyDish, toggleDishStatus,
  listFeedbacks, updateFeedbackStatus,
  importPreview, importConfirm,
  getVersions, rollbackVersion, getChangeLog,
  listCafeterias, listWindowsByCafeteria, getStatusOptions,
};
