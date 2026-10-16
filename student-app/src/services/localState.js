const ANONYMOUS_ID_KEY = 'today-eat:anonymous-id'
const DAILY_STATUS_KEY = 'today-eat:daily-status'
const HISTORY_KEY = 'today-eat:history'

export const STATUS_OPTIONS = [
  { value: 'normal', label: '正常', icon: '☀️', hint: '今天状态不错' },
  { value: 'sick', label: '生病', icon: '🤒', hint: '想吃点温和的' },
  { value: 'heat', label: '上火', icon: '🌶️', hint: '清爽一点更舒服' },
  { value: 'stomach', label: '肠胃不适', icon: '🍵', hint: '给肠胃减减负' },
  { value: 'period', label: '生理期', icon: '🌷', hint: '照顾好今天的自己' }
]

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createAnonymousId() {
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `anon_${Date.now().toString(36)}_${randomPart}`
}

export function getAnonymousIdentity() {
  let id = uni.getStorageSync(ANONYMOUS_ID_KEY)
  if (!id) {
    id = createAnonymousId()
    uni.setStorageSync(ANONYMOUS_ID_KEY, id)
  }
  return { id, kind: 'anonymous', synced: false }
}

export function getTodayStatus() {
  const saved = uni.getStorageSync(DAILY_STATUS_KEY)
  const today = getLocalDateKey()
  return saved?.date === today ? saved : null
}

export function saveTodayStatus(status) {
  const record = {
    date: getLocalDateKey(),
    status,
    updatedAt: new Date().toISOString()
  }
  uni.setStorageSync(DAILY_STATUS_KEY, record)
  return record
}

export function getHistory() {
  return uni.getStorageSync(HISTORY_KEY) || []
}

export function addHistoryRecord(dish) {
  const history = getHistory()
  const record = {
    id: `meal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    eatenAt: new Date().toISOString(),
    dish
  }
  uni.setStorageSync(HISTORY_KEY, [record, ...history])
  return record
}

export function removeHistoryRecord(id) {
  const history = getHistory().filter((record) => record.id !== id)
  uni.setStorageSync(HISTORY_KEY, history)
  return history
}
