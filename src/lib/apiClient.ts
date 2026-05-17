import axios, { AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/lib/authStore'

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach the caller's active workspace ID on every request. Server is still
// authoritative (validates membership) — this is just a fast-path hint that
// avoids an extra round-trip when the user switches workspaces mid-session.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const wsId = useAuthStore.getState().activeWorkspaceId
    if (wsId) {
      config.headers = config.headers ?? {}
      ;(config.headers as Record<string, string>)['X-Workspace-Id'] = wsId
    }
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown) {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve()))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config as AxiosRequestConfig & { _retry?: boolean }
    const status = err.response?.status
    const url = originalRequest?.url ?? ''

    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') ||
      url.includes('/auth/refresh') || url.includes('/auth/me')

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint && typeof window !== 'undefined') {
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest)).catch(() => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await api.post('/auth/refresh')
        processQueue(null)
        return api(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr)
        useAuthStore.getState().setUser(null)
        window.location.href = '/auth/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err);
  },
);

export default api;
