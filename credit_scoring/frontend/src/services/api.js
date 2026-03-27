/**
 * API service layer — all backend communication goes through here.
 * Base URL auto-uses Vite proxy in dev; override VITE_API_URL for production.
 */

const BASE_URL = import.meta.env.VITE_API_URL || ''

function getToken() {
  return localStorage.getItem('access_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }

  return res.json()
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

// ---- Bias ----

export async function getBias() {
  return request('/bias')
}
