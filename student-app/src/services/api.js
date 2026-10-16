const PUBLIC_API_BASE = 'https://doyeat-d0golk77lb63ff44e-1462172342.ap-shanghai.app.tcloudbase.com/api'
const ADMIN_TOKEN_KEY = 'today-eat:admin-token'

const configuredBase = import.meta.env.VITE_API_BASE_URL
const API_BASE = (configuredBase || (import.meta.env.PROD ? PUBLIC_API_BASE : '/api')).replace(/\/$/, '')

function buildUrl(path) {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

function getAdminToken() {
  return uni.getStorageSync(ADMIN_TOKEN_KEY) || ''
}

function setAdminToken(token) {
  uni.setStorageSync(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken() {
  uni.removeStorageSync(ADMIN_TOKEN_KEY)
}

export function hasAdminToken() {
  return Boolean(getAdminToken())
}

export function request(path, options = {}) {
  const { method = 'GET', data, headers = {} } = options
  const token = getAdminToken()

  return new Promise((resolve, reject) => {
    uni.request({
      url: buildUrl(path),
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers
      },
      success(response) {
        const body = response.data || {}
        if (response.statusCode < 200 || response.statusCode >= 300 || body.success === false) {
          const error = new Error(body.error?.message || `请求失败（${response.statusCode}）`)
          error.status = response.statusCode
          error.data = body
          reject(error)
          return
        }
        resolve(body)
      },
      fail(error) {
        reject(new Error(error.errMsg || '网络请求失败'))
      }
    })
  })
}

function queryString(params = {}) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
  return query ? `?${query}` : ''
}

export async function searchDishes(filters = {}) {
  const supported = {
    keyword: filters.keyword,
    category_major: filters.categoryMajor,
    category_minor: filters.categoryMinor,
    cafeteria_id: filters.cafeteriaId,
    budget: filters.budget,
    flavor: filters.flavor,
    is_packable: filters.isPackable
  }
  const response = await request(`/dishes/search${queryString(supported)}`)
  return response.data?.data || []
}

export async function getDish(dishId) {
  const response = await request(`/dishes/${encodeURIComponent(dishId)}`)
  return response.data
}

export async function getCafeterias() {
  const response = await request('/cafeterias')
  return response.data?.data || []
}

export async function getWindows(cafeteriaId) {
  const response = await request(`/cafeterias/${encodeURIComponent(cafeteriaId)}/windows`)
  return response.data?.data || []
}

export async function adminLogin(password) {
  const response = await request('/admin/login', {
    method: 'POST',
    data: { password }
  })
  setAdminToken(response.data.token)
  return response.data
}

export async function adminVerify() {
  return request('/admin/verify')
}

export async function adminListDishes(keyword = '') {
  const response = await request(`/admin/dishes${queryString({ keyword })}`)
  return response.data?.data || []
}

export async function adminUpdateDish(dishId, data) {
  return request(`/admin/dishes/${encodeURIComponent(dishId)}`, {
    method: 'PUT',
    data
  })
}

export async function adminToggleDishStatus(dishId, status, reason = '') {
  return request(`/admin/dishes/${encodeURIComponent(dishId)}/status`, {
    method: 'PATCH',
    data: { status, reason }
  })
}

export async function adminGetVersions() {
  const response = await request('/admin/versions')
  return response.data
}

export async function adminGetChangeLog() {
  const response = await request('/admin/changelog')
  return response.data
}

export async function adminPreviewImport(file) {
  const token = getAdminToken()
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(buildUrl('/admin/import/preview'), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  })
  const body = await response.json()
  if (!response.ok || body.success === false) {
    throw new Error(body.error?.message || 'Excel 预览失败')
  }
  return body.data
}

export async function adminConfirmImport(data, reason) {
  const response = await request('/admin/import/confirm', {
    method: 'POST',
    data: { data, reason }
  })
  return response.data
}
