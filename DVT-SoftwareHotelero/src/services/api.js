// Punto unico de comunicacion con el backend.
// Todas las vistas usan apiFetch para no repetir URL base, headers ni manejo de sesion.
// En produccion frontend y backend comparten origen. En desarrollo, .env
// mantiene la URL local del servidor API.
const API_URL = import.meta.env.VITE_API_URL || '/api'

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')

  // Headers base para peticiones JSON. Si hay token guardado, se envia como Bearer.
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

  // Si el backend rechaza el token, se limpia la sesion local y se vuelve al login.
  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = `${import.meta.env.BASE_URL}login`
    throw new Error('Sesion expirada')
  }

  const data = await response.json()

  // Convierte errores HTTP en excepciones para que cada vista los muestre en pantalla.
  if (!response.ok) {
    throw new Error(data.message || 'Error en la peticion')
  }

  return data
}
