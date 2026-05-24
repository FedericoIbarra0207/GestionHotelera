// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Sesion expirada')
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Error en la peticion')
  }

  return data
}
