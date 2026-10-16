const BaseRepository = require('./baseRepository');

class DishRepository extends BaseRepository {
  constructor() {
    super('dishes', 'dish_id');
  }

  findByCafeteriaId(cafeteriaId) {
    const items = this.findAll();
    return items.filter(item => item.cafeteria_id === cafeteriaId);
  }

  findByWindowId(windowId) {
    const items = this.findAll();
    return items.filter(item => item.window_id === windowId);
  }

  searchByKeyword(keyword) {
    const items = this.findAll();
    const kw = keyword.toLowerCase();
    return items.filter(item =>
      (item.dish_name && item.dish_name.toLowerCase().includes(kw)) ||
      (item.keywords && item.keywords.toLowerCase().includes(kw))
    );
  }

  /**
   * 组合筛选搜索
   * @param {Object} filters
   * @param {string} [filters.keyword] - 关键词，匹配 dish_name 和 keywords
   * @param {string} [filters.category_major] - 大类精确匹配
   * @param {string} [filters.category_minor] - 小类精确匹配
   * @param {string} [filters.cafeteria_id] - 食堂编号精确匹配
   * @param {number} [filters.budget] - 预算上限，price_max <= budget
   * @param {string} [filters.flavor] - 口味筛选（子串匹配，兼容多口味标签）
   * @param {string} [filters.is_packable] - 打包状态（是/否/未知）
   * @returns {Array}
   */
  searchWithFilters(filters) {
    let items = this.findAll();
    const { keyword, category_major, category_minor, cafeteria_id, budget, flavor, is_packable } = filters;

    // 关键词筛选（忽略空字符串）
    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      items = items.filter(item =>
        (item.dish_name && item.dish_name.toLowerCase().includes(kw)) ||
        (item.keywords && item.keywords.toLowerCase().includes(kw))
      );
    }

    // 大类精确筛选
    if (category_major) {
      items = items.filter(item => item.category_major === category_major);
    }

    // 小类精确筛选
    if (category_minor) {
      items = items.filter(item => item.category_minor === category_minor);
    }

    // 食堂精确筛选
    if (cafeteria_id) {
      items = items.filter(item => item.cafeteria_id === cafeteria_id);
    }

    // 预算筛选：price_max <= budget
    if (budget !== undefined && budget !== null) {
      items = items.filter(item => item.price_max !== null && item.price_max !== undefined && item.price_max <= budget);
    }

    // 口味筛选：子串匹配（兼容多口味标签）
    if (flavor) {
      items = items.filter(item => {
        if (!item.flavor) return false;
        return item.flavor.includes(flavor);
      });
    }

    // 打包状态筛选
    if (is_packable) {
      items = items.filter(item => item.is_packable === is_packable);
    }

    return items;
  }
}

module.exports = new DishRepository();

