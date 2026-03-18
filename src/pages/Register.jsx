import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff, Zap, User, Mail, Lock } from "lucide-react"
import ParticleBackground from "../components/ParticleBackground"
import { useAuth } from "../context/AuthContext"

export default function Register() {
  const [form, setForm]         = useState({ name: "", email: "", password: "", confirm: "" })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const { register }            = useAuth()
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Client-side validation
    if (!form.name.trim())     return setError("Name is required")
    if (!form.email.trim())    return setError("Email is required")
    if (form.password.length < 8) return setError("Password must be at least 8 characters")
    if (form.password !== form.confirm) return setError("Passwords do not match")

    setLoading(true)
    try {
      await register(form.name.trim(), form.email.trim(), form.password)
      navigate("/")
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed — please try again")
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#060912" }}>
      <ParticleBackground />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.07), transparent 70%)", filter: "blur(40px)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,212,255,0.06), transparent 70%)", filter: "blur(40px)" }} />

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
            boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(0,212,255,0.04)"
          }}>

          {/* Top glow line */}
          <div className="absolute top-0 left-8 right-8 h-px"
            style={{ background: "linear-gradient(90deg,transparent,#00d4ff,transparent)" }} />

          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(0,212,255,0.2))",
                border: "1px solid rgba(0,212,255,0.3)",
                boxShadow: "0 0 20px rgba(0,212,255,0.15)"
              }}>
              <Zap size={22} color="#00d4ff" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-widest"
              style={{ fontFamily: "Orbitron", color: "#00d4ff", textShadow: "0 0 15px rgba(0,212,255,0.5)" }}>
              AJ SENTINEL
            </h1>
            <p className="text-xs mt-1" style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
              CREATE YOUR ACCOUNT
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-xs mb-1.5"
                style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>FULL NAME</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#334155" }} />
                <input
                  type="text"
                  className="input-cyber pl-9"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={set("name")}
                />
              </div>
            </div>

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
                  value={form.email}
                  onChange={set("email")}
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
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={set("password")}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#334155" }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {/* Password strength bar */}
              {form.password.length > 0 && (
                <div className="mt-1.5 flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex-1 h-0.5 rounded-full transition-all duration-300"
                      style={{
                        background: form.password.length >= i * 3
                          ? i <= 1 ? "#ff3366"
                          : i <= 2 ? "#ff8c42"
                          : i <= 3 ? "#ffd60a" : "#00ff88"
                          : "rgba(255,255,255,0.06)"
                      }} />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs mb-1.5"
                style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>CONFIRM PASSWORD</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#334155" }} />
                <input
                  type="password"
                  className="input-cyber pl-9"
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  style={{
                    borderColor: form.confirm && form.confirm !== form.password
                      ? "rgba(255,51,102,0.4)" : ""
                  }}
                />
              </div>
            </div>

            {/* Error */}
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
              className="btn-cyber-solid w-full mt-2"
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
                  CREATING ACCOUNT...
                </span>
              ) : "CREATE ACCOUNT"}
            </motion.button>
          </form>

          {/* Login link */}
          <p className="text-center text-xs mt-5"
            style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
            Already have an account?{" "}
            <Link to="/login"
              className="transition-colors hover:text-cyan-400"
              style={{ color: "#00d4ff" }}>
              LOGIN
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
