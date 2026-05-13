import axios from 'axios'

const api = axios.create({
  baseURL: '/api-proxy',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const url = err.config?.url ?? ''

    // Only redirect on 401 for protected routes — not for the bootstrap /auth/me check
    if (status === 401 && typeof window !== 'undefined' && !url.includes('/auth/me') && !url.includes('/auth/login')) {
      window.location.href = '/auth/login'
    }

    return Promise.reject(err)
  }
)

export default api
