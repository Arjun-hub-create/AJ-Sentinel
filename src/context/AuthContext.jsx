import { createContext, useContext, useState, useEffect } from "react"
import api from "../services/api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

 
  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem("sentinel_token")
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get("/api/auth/me")
        setUser(data)
      } catch {
        localStorage.removeItem("sentinel_token")
        localStorage.removeItem("sentinel_user")
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password })
    localStorage.setItem("sentinel_token", data.access_token)
    localStorage.setItem("sentinel_user", JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const register = async (name, email, password) => {
    const { data } = await api.post("/api/auth/register", { name, email, password })
    localStorage.setItem("sentinel_token", data.access_token)
    localStorage.setItem("sentinel_user", JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem("sentinel_token")
    localStorage.removeItem("sentinel_user")
    setUser(null)
    window.location.href = "/login"
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
