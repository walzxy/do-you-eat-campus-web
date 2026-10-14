const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Token 管理
const TOKEN_KEY = 'admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    headers,
    ...options
  });

  const json = await res.json();

  if (!res.ok) {
    const err = new Error(json.error?.message || `API error: ${res.status}`);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json;
}

// ---- 公开接口 ----

export async function healthCheck() {
  return request('/health');
}

// ---- 管理接口 ----

export async function adminLogin(password) {
  const res = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || '登录失败');
  }
  setToken(json.data.token);
  return json.data;
}

export async function adminVerify() {
  return request('/admin/verify');
}

export async function adminListDishes(keyword = '') {
  const qs = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
  return request(`/admin/dishes${qs}`);
}

export async function adminGetDish(dishId) {
  return request(`/admin/dishes/${dishId}`);
}

export async function adminUpdateDish(dishId, data) {
  return request(`/admin/dishes/${dishId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function adminCreateDish(data) {
  return request('/admin/dishes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminCopyDish(dishId, data) {
  return request(`/admin/dishes/${dishId}/copy`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminToggleDishStatus(dishId, data) {
  return request(`/admin/dishes/${dishId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function adminListFeedbacks(status = '', page = 1) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  return request(`/admin/feedbacks?${params.toString()}`);
}

export async function adminUpdateFeedbackStatus(feedbackId, data) {
  return request(`/admin/feedbacks/${feedbackId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function adminGetCafeterias() {
  return request('/admin/cafeterias');
}

export async function adminGetWindowsByCafeteria(cafeteriaId) {
  return request(`/admin/cafeterias/${cafeteriaId}/windows`);
}

export async function adminGetStatusOptions() {
  return request('/admin/status-options');
}

export async function adminGetVersions() {
  return request('/admin/versions');
}

export async function adminRollback(reason = '') {
  return request('/admin/versions/rollback', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function adminGetChangeLog(page = 1) {
  return request(`/admin/changelog?page=${page}`);
}
