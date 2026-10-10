// 菜品数据校验规则
// 价格使用 price_min 和 price_max 两个数值字段
// 分类使用 category_major 和 category_minor 两个字段

const VALID_STATUSES = [
  '已核实售卖',
  '菜单记录，未核实',
  '可能售卖',
  '暂时未售卖',
  '已停止记录',
  '未知',
];

function validateDishRow(row) {
  const errors = [];

  if (!row.dish_id) errors.push('缺少菜品编号');
  if (!row.dish_name) errors.push('缺少菜品名称');
  if (!row.cafeteria_id) errors.push('缺少食堂编号');
  if (!row.window_id) errors.push('缺少窗口编号');

  // 价格校验：price_min 和 price_max
  if (row.price_min !== undefined && row.price_min !== null) {
    const pMin = Number(row.price_min);
    if (isNaN(pMin) || pMin < 0) {
      errors.push('price_min 格式不正确: ' + row.price_min);
    }
  } else {
    errors.push('缺少 price_min');
  }

  if (row.price_max !== undefined && row.price_max !== null && row.price_max !== '') {
    const pMax = Number(row.price_max);
    if (isNaN(pMax) || pMax < 0) {
      errors.push('price_max 格式不正确: ' + row.price_max);
    }
  }

  // price_min 不能大于 price_max
  if (errors.length === 0 || !errors.some(e => e.includes('price_min') || e.includes('price_max'))) {
    const pMin = Number(row.price_min);
    const pMax = Number(row.price_max);
    if (row.price_max !== undefined && row.price_max !== null && row.price_max !== '' && !isNaN(pMin) && !isNaN(pMax) && pMin > pMax) {
      errors.push('price_min 不能大于 price_max: ' + pMin + ' > ' + pMax);
    }
  }

  // 分类校验：category_major 是必填字段
  if (!row.category_major) {
    errors.push('缺少大类');
  }

  // category_minor 可为空

  // availability_status 是必填字段
  if (!row.availability_status) {
    errors.push('缺少供应状态');
  } else if (!VALID_STATUSES.includes(row.availability_status)) {
    errors.push('供应状态值不在允许范围内: ' + row.availability_status);
  }

  return errors;
}

module.exports = { validateDishRow, VALID_STATUSES };