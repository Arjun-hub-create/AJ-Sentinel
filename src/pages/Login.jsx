import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff, Zap, Mail, Lock } from "lucide-react"
import ParticleBackground from "../components/ParticleBackground"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const { login }               = useAuth()
  const navigate                = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")

    if (!email.trim())    return setError("Email is required")
    if (!password.trim()) return setError("Password is required")

    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate("/")
    } catch (err) {
      // Show the exact error from backend
      const msg = err.response?.data?.detail
      setError(msg || "Login failed — check your credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#060912" }}>
      <ParticleBackground />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,212,255,0.06), transparent 70%)", filter: "blur(40px)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.08), transparent 70%)", filter: "blur(40px)" }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div className="rounded-2xl p-8 relative"
          style={{
            background: "rgba(10,14,28,0.95)",
            border: "1px solid rgba(0,212,255,0.15)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(0,212,255,0.05)"
          }}>

          {/* Top glow line */}
          <div className="absolute top-0 left-8 right-8 h-px"
            style={{ background: "linear-gradient(90deg,transparent,#00d4ff,transparent)" }} />

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: "linear-gradient(135deg,rgba(0,212,255,0.2),rgba(124,58,237,0.2))",
                border: "1px solid rgba(0,212,255,0.3)",
                boxShadow: "0 0 20px rgba(0,212,255,0.2)"
              }}>
              <Zap size={22} color="#00d4ff" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-widest"
              style={{ fontFamily: "Orbitron", color: "#00d4ff", textShadow: "0 0 15px rgba(0,212,255,0.5)" }}>
              AJ SENTINEL
            </h1>
            <p className="text-xs mt-1" style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
              MONITORING PLATFORM
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs mb-1.5"
                style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>EMAIL</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#334155" }} />
                <input
                  type="email"
                  className="input-cyber pl-9"
                  placeholder="operator@sentinel.io"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs mb-1.5"
                style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>PASSWORD</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#334155" }} />
                <input
                  type={showPass ? "text" : "password"}
                  className="input-cyber pl-9 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#334155" }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs px-3 py-2 rounded-lg"
                style={{
                  color: "#ff3366",
                  background: "rgba(255,51,102,0.08)",
                  border: "1px solid rgba(255,51,102,0.2)",
                  fontFamily: "JetBrains Mono"
                }}>
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              className="btn-cyber-solid w-full mt-6"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                  />
                  AUTHENTICATING...
                </span>
              ) : "ACCESS SYSTEM"}
            </motion.button>
          </form>

          {/* Register link */}
          <p className="text-center text-xs mt-5"
            style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
            No account yet?{" "}
            <Link to="/register"
              className="transition-colors hover:text-cyan-300"
              style={{ color: "#00d4ff" }}>
              CREATE ONE
            </Link>
          </p>

          <p className="text-center text-xs mt-4"
            style={{ color: "#1e293b", fontFamily: "JetBrains Mono" }}>
            SENTINEL v2.4.1 — SECURE ACCESS ONLY
          </p>
        </div>
      </motion.div>
    </div>
  )
}
