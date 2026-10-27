const socialRepository = require('../repositories/socialRepository');
const dishRepository = require('../repositories/dishRepository');
const { success, fail } = require('../utils/response');
const { getAnonymousId, validateAnonymousId } = require('../middleware/anonymousAuth');

const FLAVOR_OPTIONS = ['清淡', '原味', '微辣', '香辣', '麻辣'];

function actorId(req) { return req.anonymousId; }

async function activeAccount(req, res) {
  const account = await socialRepository.getAccount(actorId(req));
  if (!account || account.status === 'deleted') {
    fail(res, '匿名账号不存在或已注销', 410);
    return null;
  }
  return account;
}

async function createSession(req, res, next) {
  try {
    const anonymousId = getAnonymousId(req);
    if (!validateAnonymousId(anonymousId)) return fail(res, 'anonymous_id 格式无效', 400);
    const existing = await socialRepository.getAccount(anonymousId);
    if (existing && existing.status === 'deleted') return fail(res, '该匿名账号已注销', 410);
    const account = existing || await socialRepository.ensureAccount(anonymousId);
    const taste = await socialRepository.getTaste(anonymousId);
    return success(res, { account, taste: taste || { flavors: [], avoid: [] } }, existing ? 200 : 201);
  } catch (error) { return next(error); }
}

async function getMe(req, res, next) {
  try {
    const account = await activeAccount(req, res);
    if (!account) return;
    const taste = await socialRepository.getTaste(actorId(req));
    const history = await socialRepository.listHistory(actorId(req), { page: 1, pageSize: 1 });
    return success(res, { account, taste: taste || { flavors: [], avoid: [] }, history_count: history.total });
  } catch (error) { return next(error); }
}

async function updateMe(req, res, next) {
  try {
    const account = await activeAccount(req, res);
    if (!account) return;
    const { display_name, avatar } = req.body || {};
    if (display_name !== undefined && (typeof display_name !== 'string' || display_name.trim().length < 1 || display_name.trim().length > 24)) {
      return fail(res, '昵称长度需为 1-24 个字符', 400);
    }
    if (avatar !== undefined && (typeof avatar !== 'string' || avatar.length > 32)) return fail(res, '头像标识无效', 400);
    const patch = { updated_at: new Date().toISOString() };
    if (display_name !== undefined) patch.display_name = display_name.trim();
    if (avatar !== undefined) patch.avatar = avatar;
    const updated = await socialRepository.updateAccount(actorId(req), patch);
    return success(res, updated || { ...account, ...patch });
  } catch (error) { return next(error); }
}

async function updateTaste(req, res, next) {
  try {
    const account = await activeAccount(req, res);
    if (!account) return;
    const { flavors = [], avoid = [] } = req.body || {};
    if (!Array.isArray(flavors) || !Array.isArray(avoid)) return fail(res, '口味画像必须是数组', 400);
    if (flavors.some(item => !FLAVOR_OPTIONS.includes(item))) return fail(res, '存在不支持的口味标签', 400);
    if (avoid.some(item => typeof item !== 'string' || item.trim().length < 1 || item.trim().length > 30)) return fail(res, '忌口内容格式无效', 400);
    if (flavors.length > 5 || avoid.length > 10) return fail(res, '口味画像选项过多', 400);
    return success(res, await socialRepository.saveTaste(actorId(req), { flavors: [...new Set(flavors)], avoid: [...new Set(avoid.map(item => item.trim()))] }));
  } catch (error) { return next(error); }
}

async function listHistory(req, res, next) {
  try {
    const account = await activeAccount(req, res);
    if (!account) return;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 30));
    return success(res, await socialRepository.listHistory(actorId(req), { page, pageSize }));
  } catch (error) { return next(error); }
}

async function addHistory(req, res, next) {
  try {
    const account = await activeAccount(req, res);
    if (!account) return;
    const { dish_id, source, eaten_at, client_id } = req.body || {};
    const dish = dish_id ? dishRepository.findById(dish_id) : null;
    if (dish_id && !dish) return fail(res, '菜品不存在: ' + dish_id, 400);
    const record = await socialRepository.addHistory(actorId(req), {
      dish_id: dish_id || null,
      client_id: typeof client_id === 'string' ? client_id.slice(0, 100) : null,
      dish_snapshot: dish ? { dish_id: dish.dish_id, dish_name: dish.dish_name, price_min: dish.price_min, price_max: dish.price_max, cafeteria_id: dish.cafeteria_id, window_id: dish.window_id, flavor: dish.flavor } : null,
      source: source || 'manual',
      eaten_at: eaten_at || undefined,
    });
    return success(res, record, 201);
  } catch (error) { return next(error); }
}

async function deleteHistory(req, res, next) {
  try {
    const account = await activeAccount(req, res);
    if (!account) return;
    const count = await socialRepository.deleteHistory(req.params.historyId, actorId(req));
    if (!count) return fail(res, '饭录不存在', 404);
    return success(res, { deleted: true });
  } catch (error) { return next(error); }
}

async function deleteAccount(req, res, next) {
  try {
    const account = await activeAccount(req, res);
    if (!account) return;
    await socialRepository.deleteAccount(actorId(req));
    return success(res, { deleted: true, content_preserved: true });
  } catch (error) { return next(error); }
}

module.exports = { createSession, getMe, updateMe, updateTaste, listHistory, addHistory, deleteHistory, deleteAccount, FLAVOR_OPTIONS };
