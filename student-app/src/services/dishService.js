import { searchDishes } from './api'

const STATUS_PREFERENCES = {
  normal: { prefer: [], avoid: [] },
  sick: { prefer: ['汤', '粥', '面', '蒸'], avoid: ['辣', '麻辣', '香辣', '炸', '烧烤'] },
  heat: { prefer: ['汤', '粥', '蔬菜', '清'], avoid: ['辣', '麻辣', '香辣', '炸', '烧烤'] },
  stomach: { prefer: ['汤', '粥', '面', '蒸'], avoid: ['辣', '麻辣', '香辣', '炸', '烧烤', '冰'] },
  period: { prefer: ['汤', '粥', '面', '热'], avoid: ['冰', '冰凉'] }
}

export function dishTitle(dish) {
  return dish?.dish_name || dish?.name || '未命名菜品'
}

export function normalizeDish(dish) {
  return {
    ...dish,
    title: dishTitle(dish),
    priceText: formatPrice(dish),
    locationText: [dish.cafeteria_name, dish.window_name].filter(Boolean).join(' · ') || '位置待补充'
  }
}

export function formatPrice(dish) {
  const min = dish?.price_min
  const max = dish?.price_max ?? min
  if (min === null || min === undefined || min === '') return '价格待补充'
  if (max === min || max === null || max === undefined || max === '') return `${min} 元`
  return `${min}–${max} 元`
}

function searchableText(dish) {
  return [dishTitle(dish), dish.keywords, dish.flavor, dish.category_major, dish.category_minor]
    .filter(Boolean)
    .join(' ')
}

export function rankDishes(dishes, { status = 'normal', cafeteriaId = '' } = {}) {
  const preferences = STATUS_PREFERENCES[status] || STATUS_PREFERENCES.normal
  const visibleDishes = dishes
    .filter((dish) => dish.availability_status !== '暂时未售卖')
    .filter((dish) => !cafeteriaId || dish.cafeteria_id === cafeteriaId)
  const compatibleDishes = visibleDishes.filter((dish) => {
    const text = searchableText(dish)
    return !preferences.avoid.some((word) => text.includes(word))
  })
  // 已知冲突菜品优先排除；如果数据过少，则退回完整可售池，避免出现空白结果。
  const sourceDishes = compatibleDishes.length ? compatibleDishes : visibleDishes

  return sourceDishes
    .map((dish) => {
      const text = searchableText(dish)
      const preferScore = preferences.prefer.reduce((score, word) => score + (text.includes(word) ? 2 : 0), 0)
      const avoidScore = preferences.avoid.reduce((score, word) => score + (text.includes(word) ? 3 : 0), 0)
      return { dish, score: preferScore - avoidScore + Math.random() }
    })
    .sort((a, b) => b.score - a.score)
    .map(({ dish }) => normalizeDish(dish))
}

export async function fetchCandidates(filters = {}) {
  const dishes = await searchDishes(filters)
  return rankDishes(dishes, filters)
}

export function pickRandom(dishes, excludedIds = []) {
  const excluded = new Set(excludedIds)
  const available = dishes.filter((dish) => !excluded.has(dish.dish_id))
  const source = available.length ? available : dishes
  if (!source.length) return null
  return source[Math.floor(Math.random() * source.length)]
}

export function getCategories(dishes) {
  return [...new Set(dishes.map((dish) => dish.category_major).filter(Boolean))].sort()
}
