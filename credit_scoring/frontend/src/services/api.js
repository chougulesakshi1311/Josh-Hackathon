/**
 * API service layer - all backend communication goes through here.
 * Base URL auto-uses Vite proxy in dev; override VITE_API_URL for production.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api'

function getToken() {
  return localStorage.getItem('access_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const email = localStorage.getItem('user_email')
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(email ? { 'X-User-Email': email } : {}),
    ...options.headers,
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  console.debug(`[api] ${options.method || 'GET'} ${path}`, response.status)

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }))
    console.error(`[api] ${path} failed`, errorBody)
    throw new Error(errorBody.detail || 'Request failed')
  }

  const data = await response.json()
  console.debug(`[api] ${path} response`, data)
  return data
}

async function download(path, filenameFallback) {
  const token = getToken()
  const email = localStorage.getItem('user_email')
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(email ? { 'X-User-Email': email } : {}),
  }

  const response = await fetch(`${BASE_URL}${path}`, { headers })
  console.debug(`[api] download ${path}`, response.status)

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }))
    console.error(`[api] download ${path} failed`, errorBody)
    throw new Error(errorBody.detail || 'Download failed')
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('content-disposition') || ''
  const filenameMatch = contentDisposition.match(/filename="?(?<filename>[^"]+)"?/)
  const filename = filenameMatch?.groups?.filename || filenameFallback

  return { blob, filename }
}

// ---- Auth ----

export async function loginUser({ email, password }) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  localStorage.setItem('access_token', data.access_token)
  localStorage.setItem('user_email', data.email)
  return data
}

export async function signupUser({ email, password }) {
  const data = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  localStorage.setItem('access_token', data.access_token)
  localStorage.setItem('user_email', data.email)
  return data
}

export function logoutUser() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user_email')
}

// ---- Prediction ----

export async function predictCredit(formData) {
  return request('/predict', {
    method: 'POST',
    body: JSON.stringify(formData),
  })
}

// ---- Dashboard ----

export async function getDashboard() {
  return request('/dashboard')
}

export async function exportDashboardReport() {
  return download('/export-report', 'dashboard-report.csv')
}

// ---- Bias ----

export async function getBias(range = '30d') {
  const search = new URLSearchParams({ range })
  return request(`/bias-metrics?${search.toString()}`)
}

export async function exportAuditLog(range = '30d') {
  const search = new URLSearchParams({ range })
  return download(`/export-audit-log?${search.toString()}`, `audit-log-${range}.csv`)
}

// ---- History ----

export async function getHistory() {
  return request('/history')
}
