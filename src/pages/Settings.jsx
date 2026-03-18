import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Key, Plus, Trash2, Copy, Check, User, Lock } from "lucide-react"
import Layout from "../components/Layout/Layout"
import api from "../services/api"
import { useAuth } from "../context/AuthContext"

export default function Settings() {
  const { user } = useAuth()
  const [apiKeys, setApiKeys]     = useState([])
  const [newKeyName, setNewKeyName] = useState("")
  const [generatedKey, setGeneratedKey] = useState(null)
  const [copied, setCopied]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [pwForm, setPwForm]       = useState({ old_password: "", new_password: "", confirm: "" })
  const [pwMsg, setPwMsg]         = useState("")
  const [pwError, setPwError]     = useState("")

  const loadKeys = useCallback(async () => {
    try {
      const { data } = await api.get("/api/keys")
      setApiKeys(data)
    } catch { setApiKeys([]) }
  }, [])

  useEffect(() => { loadKeys() }, [loadKeys])

  const handleCreateKey = async (e) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    setLoading(true)
    try {
      const { data } = await api.post("/api/keys", { name: newKeyName })
      setGeneratedKey(data.key)
      setNewKeyName("")
      loadKeys()
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create key")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteKey = async (id) => {
    if (!window.confirm("Delete this API key?")) return
    try {
      await api.delete(`/api/keys/${id}`)
      loadKeys()
    } catch {}
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwError("")
    setPwMsg("")
    if (pwForm.new_password !== pwForm.confirm) return setPwError("Passwords do not match")
    if (pwForm.new_password.length < 8) return setPwError("Password must be at least 8 characters")
    try {
      await api.put("/api/auth/password", {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      })
      setPwMsg("Password updated successfully")
      setPwForm({ old_password: "", new_password: "", confirm: "" })
    } catch (err) {
      setPwError(err.response?.data?.detail || "Failed to update password")
    }
  }

  return (
    <Layout>
      <div className="mb-6">
        <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold uppercase"
          style={{ fontFamily: "Orbitron", color: "#e2e8f0", letterSpacing: "0.12em" }}>
          Settings
        </motion.h1>
        <p className="text-xs mt-1" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
          Manage your account, API keys and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-5"
          style={{ background: "rgba(10,14,28,0.8)", border: "1px solid rgba(0,212,255,0.1)" }}>
          <div className="flex items-center gap-2 mb-4">
            <User size={14} style={{ color: "#00d4ff" }} />
            <h3 className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8", fontFamily: "Orbitron" }}>Profile</h3>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background: "linear-gradient(135deg,#00d4ff,#7c3aed)", color: "#000", fontFamily: "Orbitron" }}>
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-semibold" style={{ color: "#e2e8f0", fontFamily: "JetBrains Mono" }}>
                {user?.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex gap-3 text-xs">
            {[
              { label: "ROLE",    value: user?.role?.toUpperCase() },
              { label: "TEAM ID", value: user?.team_id?.slice(-8) || "—" },
            ].map(s => (
              <div key={s.label} className="flex-1 rounded-lg px-3 py-2"
                style={{ background: "rgba(0,0,0,0.3)" }}>
                <p style={{ color: "#1e293b", fontFamily: "JetBrains Mono", fontSize: 9 }}>{s.label}</p>
                <p className="mt-0.5 font-semibold" style={{ color: "#00d4ff", fontFamily: "JetBrains Mono" }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-xl p-5"
          style={{ background: "rgba(10,14,28,0.8)", border: "1px solid rgba(0,212,255,0.1)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Lock size={14} style={{ color: "#00d4ff" }} />
            <h3 className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8", fontFamily: "Orbitron" }}>Change Password</h3>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            {["old_password","new_password","confirm"].map((field, i) => (
              <input key={field} type="password" className="input-cyber text-xs"
                style={{ height: 36 }}
                placeholder={["Current password","New password (8+ chars)","Confirm new password"][i]}
                value={pwForm[field]}
                onChange={e => setPwForm({...pwForm, [field]: e.target.value})} />
            ))}
            {pwError && <p className="text-xs" style={{ color: "#ff3366", fontFamily: "JetBrains Mono" }}>{pwError}</p>}
            {pwMsg   && <p className="text-xs" style={{ color: "#00ff88", fontFamily: "JetBrains Mono" }}>{pwMsg}</p>}
            <button type="submit" className="btn-cyber w-full text-xs">UPDATE PASSWORD</button>
          </form>
        </motion.div>

        {/* API Keys */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-xl p-5"
          style={{ background: "rgba(10,14,28,0.8)", border: "1px solid rgba(0,212,255,0.1)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Key size={14} style={{ color: "#00d4ff" }} />
            <h3 className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8", fontFamily: "Orbitron" }}>API Keys</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
            Use these keys to ingest logs from external services via POST /api/logs
          </p>

          {/* New key generated — show once */}
          {generatedKey && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-lg p-3 mb-4 flex items-center justify-between gap-3"
              style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)" }}>
              <div className="min-w-0">
                <p className="text-xs mb-1" style={{ color: "#00ff88", fontFamily: "JetBrains Mono" }}>
                  ✅ Key created — copy it now, it won't be shown again
                </p>
                <p className="text-xs font-mono truncate" style={{ color: "#e2e8f0" }}>{generatedKey}</p>
              </div>
              <button onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs flex-shrink-0"
                style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)", fontFamily: "JetBrains Mono" }}>
                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
            </motion.div>
          )}

          {/* Create key form */}
          <form onSubmit={handleCreateKey} className="flex gap-2 mb-4">
            <input className="input-cyber text-xs flex-1" style={{ height: 36 }}
              placeholder="Key name e.g. my-api-service"
              value={newKeyName} onChange={e => setNewKeyName(e.target.value)} />
            <button type="submit" disabled={loading}
              className="btn-cyber-solid flex items-center gap-1.5 text-xs px-4"
              style={{ height: 36 }}>
              <Plus size={13} /> Generate
            </button>
          </form>

          {/* Keys list */}
          {apiKeys.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
              No API keys yet
            </p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map(k => (
                <div key={k.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#e2e8f0", fontFamily: "JetBrains Mono" }}>
                      {k.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
                      {k.key_prefix}•••• · Created {new Date(k.created_at).toLocaleDateString()}
                      {k.last_used && ` · Last used ${new Date(k.last_used).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteKey(k.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    style={{ color: "#475569" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}
