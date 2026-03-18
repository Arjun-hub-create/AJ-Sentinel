import api from "./api"

export const authService = {

  async login(email, password) {
    const { data } = await api.post("/api/auth/login", { email, password })
    localStorage.setItem("sentinel_token", data.access_token)
    localStorage.setItem("sentinel_user", JSON.stringify(data.user))
    return data
  },

  async register(name, email, password) {
    const { data } = await api.post("/api/auth/register", { name, email, password })
    localStorage.setItem("sentinel_token", data.access_token)
    localStorage.setItem("sentinel_user", JSON.stringify(data.user))
    return data
  },

  async me() {
    const { data } = await api.get("/api/auth/me")
    return data
  },

  logout() {
    localStorage.removeItem("sentinel_token")
    localStorage.removeItem("sentinel_user")
    window.location.href = "/login"
  },

  getToken() {
    return localStorage.getItem("sentinel_token")
  },

  getUser() {
    const raw = localStorage.getItem("sentinel_user")
    return raw ? JSON.parse(raw) : null
  },

  isAuthenticated() {
    return !!localStorage.getItem("sentinel_token")
  },
}
