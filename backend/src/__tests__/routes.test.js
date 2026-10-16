import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

// ============================================================
// 食堂接口测试
// ============================================================
describe('食堂 GET /api/cafeterias', () => {
  it('应返回食堂列表（含 data 和 total）', async () => {
    const res = await request(app).get('/api/cafeterias');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(typeof res.body.data.total).toBe('number');
    expect(res.body.data.total).toBeGreaterThan(0);
    // 验证字段结构
    const item = res.body.data.data[0];
    expect(item).toHaveProperty('cafeteria_id');
    expect(item).toHaveProperty('cafeteria_name');
    expect(item).toHaveProperty('campus');
  });

  it('支持 ?campus= 筛选', async () => {
    const res = await request(app).get('/api/cafeterias?campus=' + encodeURIComponent('国定'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBeGreaterThan(0);
    // 所有结果 campus 应包含"国定"
    res.body.data.data.forEach(item => {
      expect(item.campus).toContain('国定');
    });
  });
});

describe('食堂详情 GET /api/cafeterias/:cafeteriaId', () => {
  it('存在的食堂应返回详情含窗口列表', async () => {
    const res = await request(app).get('/api/cafeterias/C001');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cafeteria_id).toBe('C001');
    expect(res.body.data.cafeteria_name).toBe('绿叶餐厅');
    // 包含窗口数组
    expect(Array.isArray(res.body.data.windows)).toBe(true);
    expect(res.body.data.windows.length).toBeGreaterThan(0);
    res.body.data.windows.forEach(w => {
      expect(w).toHaveProperty('window_id');
      expect(w).toHaveProperty('window_name');
    });
  });

  it('不存在的食堂应返回 404', async () => {
    const res = await request(app).get('/api/cafeterias/C999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('食堂不存在');
    expect(res.body.error.message).toContain('C999');
  });
});

describe('食堂窗口列表 GET /api/cafeterias/:cafeteriaId/windows', () => {
  it('存在的食堂应返回其窗口列表', async () => {
    const res = await request(app).get('/api/cafeterias/C001/windows');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.total).toBeGreaterThan(0);
    // 验证字段
    res.body.data.data.forEach(w => {
      expect(w).toHaveProperty('window_id');
      expect(w).toHaveProperty('window_name');
      expect(w).toHaveProperty('cafeteria_id');
    });
  });

  it('不存在的食堂应返回 404', async () => {
    const res = await request(app).get('/api/cafeterias/C999/windows');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('食堂不存在');
  });
});
// ============================================================
// 窗口接口测试
// ============================================================
describe('窗口详情 GET /api/windows/:windowId', () => {
  it('存在的窗口应返回详情含菜品列表', async () => {
    const res = await request(app).get('/api/windows/W001');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.window_id).toBe('W001');
    expect(res.body.data.window_name).toBe('米线窗口');
    expect(res.body.data).toHaveProperty('cafeteria_name');
    // 菜品数组
    expect(Array.isArray(res.body.data.dishes)).toBe(true);
    expect(res.body.data.dishes_total).toBeGreaterThan(0);
  });

  it('不存在的窗口应返回 404', async () => {
    const res = await request(app).get('/api/windows/W999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('窗口不存在');
    expect(res.body.error.message).toContain('W999');
  });
});

describe('窗口菜品列表 GET /api/windows/:windowId/dishes', () => {
  it('存在的窗口应返回其菜品列表', async () => {
    const res = await request(app).get('/api/windows/W001/dishes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.total).toBeGreaterThan(0);
    // 菜品字段
    res.body.data.data.forEach(d => {
      expect(d).toHaveProperty('dish_id');
      expect(d).toHaveProperty('dish_name');
      expect(d).toHaveProperty('price_min');
      expect(d).toHaveProperty('price_max');
    });
  });

  it('不存在的窗口应返回 404', async () => {
    const res = await request(app).get('/api/windows/W999/dishes');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('窗口不存在');
  });
});

// ============================================================
// 菜品接口测试
// ============================================================
describe('菜品详情 GET /api/dishes/:dishId', () => {
  it('存在的菜品应返回完整详情', async () => {
    const res = await request(app).get('/api/dishes/D001');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dish_id).toBe('D001');
    expect(res.body.data.dish_name).toBe('番茄牛肉米线');
    // 价格字段
    expect(typeof res.body.data.price_min).toBe('number');
    expect(typeof res.body.data.price_max).toBe('number');
    // 分类字段
    expect(res.body.data).toHaveProperty('category_major');
    // 关联信息
    expect(res.body.data).toHaveProperty('cafeteria_name');
    expect(res.body.data).toHaveProperty('window_name');
  });

  it('不存在的菜品应返回 404', async () => {
    const res = await request(app).get('/api/dishes/D999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('菜品不存在');
    expect(res.body.error.message).toContain('D999');
  });
});

describe('菜品搜索 GET /api/dishes/search', () => {
  it('搜索"米线"应返回结果', async () => {
    const res = await request(app).get('/api/dishes/search?keyword=' + encodeURIComponent('米线'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.total).toBeGreaterThan(0);
    // 每个结果包含基础字段
    res.body.data.data.forEach(d => {
      expect(d).toHaveProperty('dish_name');
      expect(d).toHaveProperty('price_min');
      expect(d).toHaveProperty('price_max');
    });
  });

  it('无参数时返回全部菜品', async () => {
    const res = await request(app).get('/api/dishes/search');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(72);
  });

  it('空关键词（无其他条件）也返回全部菜品', async () => {
    const res = await request(app).get('/api/dishes/search?keyword=');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(72);
  });
});

// ============================================================
// T10 组合筛选测试
// ============================================================
describe('菜品组合筛选 GET /api/dishes/search - 预算筛选', () => {
  it('budget=10 时，price_max<=10 的菜品', async () => {
    const res = await request(app).get('/api/dishes/search?budget=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // 验证全部结果 price_max <= 10
    res.body.data.data.forEach(d => {
      expect(d.price_max).toBeLessThanOrEqual(10);
    });
    // 区间价格 10-25 的麻辣烫不应出现
    const hasRange = res.body.data.data.some(d => d.dish_id === 'D008');
    expect(hasRange).toBe(false);
  });

  it('budget=12 时，price_max<=12 的菜品全部返回，>12 的不返回', async () => {
    const res = await request(app).get('/api/dishes/search?budget=12');
    expect(res.status).toBe(200);
    // 单值价格 12 的菜品应返回（如 D014 杨枝甘露 12-12）
    expect(res.body.data.data.some(d => d.dish_id === 'D014')).toBe(true);
    // 区间价格 10-14 的菜品不应返回（D021 自选三样，price_max=14>12）
    expect(res.body.data.data.some(d => d.dish_id === 'D021')).toBe(false);
    // 验证全部结果 price_max <= 12
    res.body.data.data.forEach(d => {
      expect(d.price_max).toBeLessThanOrEqual(12);
    });
  });

  it('budget=abc 返回 400', async () => {
    const res = await request(app).get('/api/dishes/search?budget=abc');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('budget 必须为数字');
  });

  it('budget=-1 返回 400', async () => {
    const res = await request(app).get('/api/dishes/search?budget=-1');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('budget 不能为负数');
  });
});

describe('菜品组合筛选 GET /api/dishes/search - 分类筛选', () => {
  it('category_major 筛选米线面条', async () => {
    const res = await request(app).get('/api/dishes/search?category_major=' + encodeURIComponent('米线面条'));
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(16);
    res.body.data.data.forEach(d => {
      expect(d.category_major).toBe('米线面条');
    });
  });

  it('category_minor 筛选盖浇饭', async () => {
    const res = await request(app).get('/api/dishes/search?category_minor=' + encodeURIComponent('盖浇饭'));
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(3);
    res.body.data.data.forEach(d => {
      expect(d.category_minor).toBe('盖浇饭');
    });
  });
});

describe('菜品组合筛选 GET /api/dishes/search - 食堂筛选', () => {
  it('按食堂编号返回对应菜品', async () => {
    const res = await request(app).get('/api/dishes/search?cafeteria_id=C001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data.length).toBeGreaterThan(0);
    expect(res.body.data.data.every(d => d.cafeteria_id === 'C001')).toBe(true);
  });
});

describe('菜品组合筛选 GET /api/dishes/search - 口味和打包筛选', () => {
  it('flavor 筛选"辣"（子串匹配）', async () => {
    const res = await request(app).get('/api/dishes/search?flavor=' + encodeURIComponent('辣'));
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThan(0);
    res.body.data.data.forEach(d => {
      expect(d.flavor).toContain('辣');
    });
  });

  it('is_packable=否', async () => {
    const res = await request(app).get('/api/dishes/search?is_packable=' + encodeURIComponent('否'));
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(6);
    res.body.data.data.forEach(d => {
      expect(d.is_packable).toBe('否');
    });
  });

  it('非法 is_packable 返回 400', async () => {
    const res = await request(app).get('/api/dishes/search?is_packable=' + encodeURIComponent('可能'));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('is_packable');
  });
});

describe('菜品组合筛选 GET /api/dishes/search - 多条件组合', () => {
  it('keyword + category_major + budget 组合', async () => {
    const res = await request(app).get('/api/dishes/search?keyword=' + encodeURIComponent('米线') +
      '&category_major=' + encodeURIComponent('米线面条') + '&budget=15');
    expect(res.status).toBe(200);
    // keyword=米线, category_major=米线面条, budget=15
    // 应该只有米线面条大类下、price_max<=15 的含"米线"的菜品
    res.body.data.data.forEach(d => {
      expect(d.category_major).toBe('米线面条');
      expect(d.price_max).toBeLessThanOrEqual(15);
      expect(d.dish_name.includes('米线') || d.keywords.includes('米线')).toBe(true);
    });
  });

  it('flavor + is_packable + budget 组合', async () => {
    const res = await request(app).get('/api/dishes/search?flavor=' + encodeURIComponent('清淡') +
      '&is_packable=' + encodeURIComponent('是') + '&budget=10');
    expect(res.status).toBe(200);
    res.body.data.data.forEach(d => {
      expect(d.flavor).toContain('清淡');
      expect(d.is_packable).toBe('是');
      expect(d.price_max).toBeLessThanOrEqual(10);
    });
  });

  it('无匹配结果返回 200 和空数组', async () => {
    const res = await request(app).get('/api/dishes/search?category_major=' + encodeURIComponent('米线面条') +
      '&budget=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.data).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });
});
