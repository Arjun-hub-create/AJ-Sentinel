import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Plus, X, Trash2, Shield, Eye, Crown, Mail } from "lucide-react"
import Layout from "../Components/Layout/Layout"
import api from "../services/api"
import { useAuth } from "../context/AuthContext"

const ROLE_CFG = {
  owner:  { color: "#ffd60a", bg: "rgba(255,214,10,0.1)",  border: "rgba(255,214,10,0.2)",  icon: Crown  },
  admin:  { color: "#00d4ff", bg: "rgba(0,212,255,0.1)",   border: "rgba(0,212,255,0.2)",   icon: Shield },
  member: { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)", icon: Users  },
  viewer: { color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.2)", icon: Eye    },
}

const InviteModal = ({ onClose, onInvited }) => {
  const [form, setForm]     = useState({ name: "", email: "", role: "member" })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError("Name is required")
    if (!form.email.trim()) return setError("Email is required")
    setLoading(true)
    try {
      await api.post("/api/teams/invite", form)
      onInvited()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to invite member")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22, ease: [0.22,1,0.36,1] }}
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{ background: "rgba(10,14,28,0.98)", border: "1px solid rgba(0,212,255,0.2)", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-12 right-12 h-px"
          style={{ background: "linear-gradient(90deg,transparent,#00d4ff,transparent)" }} />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest"
            style={{ fontFamily: "Orbitron", color: "#00d4ff" }}>Invite Member</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "#475569" }}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>FULL NAME</label>
            <input className="input-cyber" placeholder="John Doe"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>EMAIL</label>
            <input className="input-cyber" type="email" placeholder="member@company.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>ROLE</label>
            <select className="input-cyber" value={form.role}
              onChange={e => setForm({...form, role: e.target.value})} style={{ cursor: "pointer" }}>
              {["admin","member","viewer"].map(r => (
                <option key={r} value={r} style={{ background: "#0a0e1c" }}>{r}</option>
              ))}
            </select>
          </div>
          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{
              color: "#ff3366", background: "rgba(255,51,102,0.08)",
              border: "1px solid rgba(255,51,102,0.2)", fontFamily: "JetBrains Mono"
            }}>{error}</p>
          )}
          <motion.button type="submit" className="btn-cyber-solid w-full"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
            {loading ? "INVITING..." : "SEND INVITE"}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function Team() {
  const [team, setTeam]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const { user }                = useAuth()

  const loadTeam = useCallback(async () => {
    try {
      const { data } = await api.get("/api/teams/me")
      setTeam(data)
    } catch {
      setTeam(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTeam() }, [loadTeam])

  const handleRemove = async (memberId) => {
    if (!window.confirm("Remove this member?")) return
    try {
      await api.delete(`/api/teams/members/${memberId}`)
      loadTeam()
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to remove member")
    }
  }

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await api.put(`/api/teams/members/${memberId}/role`, { role: newRole })
      loadTeam()
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update role")
    }
  }

  return (
    <Layout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold uppercase"
            style={{ fontFamily: "Orbitron", color: "#e2e8f0", letterSpacing: "0.12em" }}>
            Team
          </motion.h1>
          <p className="text-xs mt-1" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
            {team?.name || "..."} · {team?.members?.length || 0} members
          </p>
        </div>
        {user?.role !== "viewer" && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => setShowModal(true)}
            className="btn-cyber-solid flex items-center gap-2"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Plus size={14} /> Invite Member
          </motion.button>
        )}
      </div>

      {/* Team Info Card */}
      {team && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-5 mb-5"
          style={{ background: "rgba(10,14,28,0.8)", border: "1px solid rgba(0,212,255,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}>
              <Users size={18} style={{ color: "#00d4ff" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#e2e8f0", fontFamily: "Orbitron" }}>
                {team.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
                Team ID: {team.id}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Members List */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl overflow-hidden"
        style={{ background: "rgba(10,14,28,0.8)", border: "1px solid rgba(0,212,255,0.1)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(0,212,255,0.08)" }}>
          <h3 className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#94a3b8", fontFamily: "Orbitron" }}>Members</h3>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-4 px-5 py-2 text-xs"
          style={{ color: "#334155", fontFamily: "JetBrains Mono", background: "rgba(0,0,0,0.2)" }}>
          <span>NAME</span><span>EMAIL</span><span>ROLE</span><span>ACTIONS</span>
        </div>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton mx-5 my-2 rounded-lg" style={{ height: 44 }} />
          ))
        ) : team?.members?.length > 0 ? (
          team.members.map((member, i) => {
            const roleCfg = ROLE_CFG[member.role] || ROLE_CFG.member
            const RoleIcon = roleCfg.icon
            const isOwner  = member.role === "owner"
            const isMe     = member.id === user?.id

            return (
              <motion.div key={member.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-4 px-5 py-3 text-xs items-center"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                {/* Name */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: "linear-gradient(135deg,#00d4ff,#7c3aed)", color: "#000", fontFamily: "Orbitron" }}>
                    {member.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span style={{ color: "#e2e8f0", fontFamily: "JetBrains Mono" }}>
                    {member.name} {isMe && <span style={{ color: "#475569" }}>(you)</span>}
                  </span>
                </div>

                {/* Email */}
                <span style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
                  {member.email}
                </span>

                {/* Role */}
                <div className="flex items-center gap-1.5">
                  {user?.role === "owner" && !isOwner && !isMe ? (
                    <select
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{
                        background: roleCfg.bg, color: roleCfg.color,
                        border: `1px solid ${roleCfg.border}`,
                        fontFamily: "JetBrains Mono", cursor: "pointer",
                      }}
                      value={member.role}
                      onChange={e => handleRoleChange(member.id, e.target.value)}>
                      {["admin","member","viewer"].map(r => (
                        <option key={r} value={r} style={{ background: "#0a0e1c" }}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                      style={{ background: roleCfg.bg, color: roleCfg.color, border: `1px solid ${roleCfg.border}`, fontFamily: "JetBrains Mono" }}>
                      <RoleIcon size={10} />
                      {member.role}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div>
                  {user?.role === "owner" && !isOwner && !isMe && (
                    <button onClick={() => handleRemove(member.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all hover:bg-red-500/10"
                      style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
                      <Trash2 size={11} /> Remove
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })
        ) : (
          <div className="flex items-center justify-center py-12"
            style={{ color: "#334155", fontFamily: "JetBrains Mono", fontSize: 13 }}>
            No members yet — invite someone
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <InviteModal onClose={() => setShowModal(false)} onInvited={loadTeam} />
        )}
      </AnimatePresence>
    </Layout>
  )
}
