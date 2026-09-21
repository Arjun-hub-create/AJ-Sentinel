import axios from "axios"

const PRODUCTION_API = "https://aj-sentinel.onrender.com"

function resolveApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (import.meta.env.PROD) return PRODUCTION_API
  return "http://localhost:8000"
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
})

const AUTH_FORM_PATHS = ["/api/auth/login", "/api/auth/register"]

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("sentinel_token")
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const path = error.config?.url || ""
    const isAuthFormRequest = AUTH_FORM_PATHS.some((p) => path.includes(p))

    // Wrong password / validation on login & register — show inline, do not redirect.
    if (status === 401 && isAuthFormRequest) {
      return Promise.reject(error)
    }

    if (status === 401) {
      localStorage.removeItem("sentinel_token")
      localStorage.removeItem("sentinel_user")
      const onAuthPage = ["/login", "/register"].includes(window.location.pathname)
      if (!onAuthPage) {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

/** Ping backend (helps Render free tier wake from sleep before auth). */
export async function wakeBackend() {
  await api.get("/health", { timeout: 90000 })
}

export default api
