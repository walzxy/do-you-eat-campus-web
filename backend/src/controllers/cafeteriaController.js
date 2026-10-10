// 食堂控制器 — 只读查询接口
const cafeteriaRepository = require('../repositories/cafeteriaRepository');
const windowRepository = require('../repositories/windowRepository');
const { success, fail } = require('../utils/response');

// GET /api/cafeterias — 食堂列表
function listCafeterias(req, res) {
  const { campus } = req.query;
  let items = cafeteriaRepository.findAll();
  if (campus) {
    items = items.filter(item => item.campus && item.campus.includes(campus));
  }
  return success(res, { data: items, total: items.length });
}

// GET /api/cafeterias/:cafeteriaId — 食堂详情（含窗口列表）
function getCafeteriaById(req, res) {
  const { cafeteriaId } = req.params;
  const cafeteria = cafeteriaRepository.findById(cafeteriaId);
  if (!cafeteria) {
    return fail(res, '食堂不存在: ' + cafeteriaId, 404);
  }
  const windows = windowRepository.findByCafeteriaId(cafeteriaId);
  return success(res, { ...cafeteria, windows });
}

module.exports = { listCafeterias, getCafeteriaById };