import { searchDishes } from './api'

const STATUS_PREFERENCES = {
  normal: { prefer: [], avoid: [] },
  sick: { prefer: ['汤', '粥', '面', '蒸'], avoid: ['辣', '麻辣', '炸', '烧烤'] },
  heat: { prefer: ['汤', '粥', '蔬菜', '清'], avoid: ['辣', '麻辣', '炸'] },
  stomach: { prefer: ['汤', '粥', '面', '蒸'], avoid: ['辣', '麻辣', '炸', '冰'] },
  period: { prefer: ['汤', '粥', '面', '热'], avoid: [] }
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
  return dishes
    .filter((dish) => dish.availability_status !== '暂时未售卖')
    .filter((dish) => !cafeteriaId || dish.cafeteria_id === cafeteriaId)
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

export function pickRandom(dishes) {
  if (!dishes.length) return null
  return dishes[Math.floor(Math.random() * dishes.length)]
}

export function getCategories(dishes) {
  return [...new Set(dishes.map((dish) => dish.category_major).filter(Boolean))].sort()
}
