// 菜品控制器 — 只读查询接口
const dishRepository = require('../repositories/dishRepository');
const cafeteriaRepository = require('../repositories/cafeteriaRepository');
const windowRepository = require('../repositories/windowRepository');
const { success, fail } = require('../utils/response');

// GET /api/dishes/search?keyword=&category_major=&category_minor=&cafeteria_id=&budget=&flavor=&is_packable=
// 组合筛选搜索菜品
function searchDishes(req, res) {
  const { keyword, category_major, category_minor, cafeteria_id, budget, flavor, is_packable } = req.query;

  // 参数校验
  // is_packable 仅允许：是、否、未知
  const VALID_PACKABLE = ['是', '否', '未知'];
  if (is_packable !== undefined && is_packable !== '' && !VALID_PACKABLE.includes(is_packable)) {
    return fail(res, 'is_packable 参数无效，仅支持：是、否、未知', 400);
  }

  // budget 校验：必须是数字且 >= 0
  let budgetNum;
  if (budget !== undefined && budget !== '') {
    budgetNum = Number(budget);
    if (isNaN(budgetNum)) {
      return fail(res, 'budget 必须为数字', 400);
    }
    if (budgetNum < 0) {
      return fail(res, 'budget 不能为负数', 400);
    }
  }

  // 构建筛选条件
  const filters = {
    keyword: keyword || '',
    category_major: category_major || '',
    category_minor: category_minor || '',
    cafeteria_id: cafeteria_id || '',
    budget: budgetNum,
    flavor: flavor || '',
    is_packable: is_packable || '',
  };

  // 如果没有任何有效筛选条件（包括 keyword），返回全部菜品
  const hasFilter = keyword || category_major || category_minor || cafeteria_id || budget !== undefined || flavor || is_packable;
  if (!hasFilter) {
    const all = dishRepository.findAll();
    return success(res, { data: all, total: all.length });
  }

  const items = dishRepository.searchWithFilters(filters);
  return success(res, { data: items, total: items.length });
}

// GET /api/windows/:windowId/dishes — 某个窗口的菜品列表
function listDishesByWindow(req, res) {
  const { windowId } = req.params;
  const window = windowRepository.findById(windowId);
  if (!window) {
    return fail(res, '窗口不存在: ' + windowId, 404);
  }
  const items = dishRepository.findByWindowId(windowId);
  return success(res, { data: items, total: items.length });
}

// GET /api/dishes/:dishId — 菜品详情
function getDishById(req, res) {
  const { dishId } = req.params;
  const dish = dishRepository.findById(dishId);
  if (!dish) {
    return fail(res, '菜品不存在: ' + dishId, 404);
  }
  const cafeteria = cafeteriaRepository.findById(dish.cafeteria_id);
  const window = windowRepository.findById(dish.window_id);
  return success(res, {
    ...dish,
    cafeteria_name: cafeteria ? cafeteria.cafeteria_name : null,
    window_name: window ? window.window_name : null,
  });
}

module.exports = { searchDishes, listDishesByWindow, getDishById };
