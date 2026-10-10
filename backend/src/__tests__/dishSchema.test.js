import { describe, it, expect } from 'vitest';
import { validateDishRow, VALID_STATUSES } from '../schemas/dishSchema.js';

describe('供应状态固定值', () => {
  it('应包含 6 个固定状态', () => {
    expect(VALID_STATUSES).toEqual([
      '已核实售卖',
      '菜单记录，未核实',
      '可能售卖',
      '暂时未售卖',
      '已停止记录',
      '未知',
    ]);
  });
});

describe('菜品校验 - 正确数据', () => {
  it('合法食堂-窗口-菜品关系应通过校验', () => {
    const row = {
      dish_id: 'D001',
      dish_name: '红烧牛肉面',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 15,
      price_max: 15,
      category_major: '米线面条',
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors).toEqual([]);
  });

  it('不同食堂的同名菜品使用不同编号应通过校验', () => {
    const row1 = {
      dish_id: 'D001',
      dish_name: '番茄炒蛋',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 8,
      price_max: 8,
      category_major: '自选简餐',
      availability_status: '已核实售卖',
    };
    const row2 = {
      dish_id: 'D002',
      dish_name: '番茄炒蛋',
      cafeteria_id: 'C002',
      window_id: 'W002',
      price_min: 9,
      price_max: 9,
      category_major: '自选简餐',
      availability_status: '可能售卖',
    };
    expect(validateDishRow(row1)).toEqual([]);
    expect(validateDishRow(row2)).toEqual([]);
  });

  it('关键词包含"米线"应能通过校验', () => {
    const row = {
      dish_id: 'D003',
      dish_name: '云南过桥米线',
      keywords: '米线、过桥米线、云南',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 18,
      price_max: 18,
      category_major: '米线面条',
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors).toEqual([]);
  });

  it('"未知"作为供应状态应通过校验', () => {
    const row = {
      dish_id: 'D004',
      dish_name: '未知菜品',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 5,
      price_max: 5,
      category_major: '自选简餐',
      availability_status: '未知',
    };
    const errors = validateDishRow(row);
    expect(errors).toEqual([]);
  });

  it('单值价格（price_min == price_max）应通过校验', () => {
    const row = {
      dish_id: 'D005',
      dish_name: '免费汤',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 0,
      price_max: 0,
      category_major: '自选简餐',
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors).toEqual([]);
  });

  it('区间价格（price_min < price_max）应通过校验', () => {
    const row = {
      dish_id: 'D006',
      dish_name: '自选套餐',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 10,
      price_max: 15,
      category_major: '自选简餐',
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors).toEqual([]);
  });

  it('分类字段 category_major 和 category_minor 可同时存在', () => {
    const row = {
      dish_id: 'D007',
      dish_name: '番茄牛肉米线',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 15,
      price_max: 15,
      category_major: '米线面条',
      category_minor: '米线',
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors).toEqual([]);
  });

  it('小类 category_minor 为空不应报错', () => {
    const row = {
      dish_id: 'D008',
      dish_name: '大盘鸡',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 28,
      price_max: 28,
      category_major: '清真风味',
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors).toEqual([]);
  });

  it('缺少供应状态应报错', () => {
    const row = {
      dish_id: 'D009',
      dish_name: '未标注状态的菜品',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 10,
      price_max: 10,
    };
    const errors = validateDishRow(row);
    expect(errors).toContain('缺少供应状态');
  });
});

describe('菜品校验 - 错误数据', () => {
  it('菜品编号为空应报错', () => {
    const row = {
      dish_id: '',
      dish_name: '测试菜',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 10,
      price_max: 10,
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors).toContain('缺少菜品编号');
  });

  it('菜品名称为空应报错', () => {
    const row = {
      dish_id: 'D010',
      dish_name: '',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 10,
      price_max: 10,
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors).toContain('缺少菜品名称');
  });

  it('食堂编号为空应报错', () => {
    const row = {
      dish_id: 'D011',
      dish_name: '测试菜',
      cafeteria_id: '',
      window_id: 'W001',
      price_min: 10,
      price_max: 10,
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors).toContain('缺少食堂编号');
  });

  it('窗口编号为空应报错', () => {
    const row = {
      dish_id: 'D012',
      dish_name: '测试菜',
      cafeteria_id: 'C001',
      window_id: '',
      price_min: 10,
      price_max: 10,
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors).toContain('缺少窗口编号');
  });

  it('price_min 不是数字应报错', () => {
    const row = {
      dish_id: 'D013',
      dish_name: '测试菜',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: '免费',
      price_max: 10,
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors.some(e => e.includes('price_min 格式不正确'))).toBe(true);
  });

  it('price_max 不是数字应报错', () => {
    const row = {
      dish_id: 'D014',
      dish_name: '测试菜',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 10,
      price_max: '免费',
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors.some(e => e.includes('price_max 格式不正确'))).toBe(true);
  });

  it('缺少 price_min 应报错', () => {
    const row = {
      dish_id: 'D015',
      dish_name: '测试菜',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_max: 10,
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors).toContain('缺少 price_min');
  });

  it('price_max 为空表示不限，不应报错', () => {
    const row = {
      dish_id: 'D016',
      dish_name: '测试菜',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 10,
      category_major: '测试大类',
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors).toEqual([]);
  });

  it('price_min 大于 price_max 应报错', () => {
    const row = {
      dish_id: 'D017',
      dish_name: '测试菜',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 20,
      price_max: 10,
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors.some(e => e.includes('price_min 不能大于 price_max'))).toBe(true);
  });

  it('price_min 为负数应报错', () => {
    const row = {
      dish_id: 'D018',
      dish_name: '测试菜',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: -5,
      price_max: 10,
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors.some(e => e.includes('price_min 格式不正确'))).toBe(true);
  });

  it('缺少大类（category_major 为空）应报错', () => {
    const row = {
      dish_id: 'D020',
      dish_name: '测试菜',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 10,
      price_max: 10,
      category_major: '',
      availability_status: '已核实售卖',
    };
    const errors = validateDishRow(row);
    expect(errors).toContain('缺少大类');
  });

  it('供应状态不在允许列表中应报错', () => {
    const row = {
      dish_id: 'D019',
      dish_name: '测试菜',
      cafeteria_id: 'C001',
      window_id: 'W001',
      price_min: 10,
      price_max: 10,
      availability_status: '限量供应',
    };
    const errors = validateDishRow(row);
    expect(errors.some(e => e.includes('供应状态值不在允许范围内'))).toBe(true);
  });
});