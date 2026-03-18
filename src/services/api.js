import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://aj-sentinel.onrender.com",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
})

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
    if (error.response?.status === 401) {
      localStorage.removeItem("sentinel_token")
      localStorage.removeItem("sentinel_user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api