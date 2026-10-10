// 窗口控制器 — 只读查询接口
const windowRepository = require('../repositories/windowRepository');
const cafeteriaRepository = require('../repositories/cafeteriaRepository');
const dishRepository = require('../repositories/dishRepository');
const { success, fail } = require('../utils/response');

// GET /api/cafeterias/:cafeteriaId/windows — 某个食堂的窗口列表
function listWindowsByCafeteria(req, res) {
  const { cafeteriaId } = req.params;
  const cafeteria = cafeteriaRepository.findById(cafeteriaId);
  if (!cafeteria) {
    return fail(res, '食堂不存在: ' + cafeteriaId, 404);
  }
  const items = windowRepository.findByCafeteriaId(cafeteriaId);
  return success(res, { data: items, total: items.length });
}

// GET /api/windows/:windowId — 窗口详情（含所属食堂信息和菜品列表）
function getWindowById(req, res) {
  const { windowId } = req.params;
  const window = windowRepository.findById(windowId);
  if (!window) {
    return fail(res, '窗口不存在: ' + windowId, 404);
  }
  const cafeteria = cafeteriaRepository.findById(window.cafeteria_id);
  const dishes = dishRepository.findByWindowId(windowId);
  return success(res, {
    ...window,
    cafeteria_name: cafeteria ? cafeteria.cafeteria_name : null,
    dishes: dishes,
    dishes_total: dishes.length,
  });
}

module.exports = { listWindowsByCafeteria, getWindowById };