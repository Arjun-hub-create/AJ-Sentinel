import { NavLink } from "react-router-dom"
import { motion } from "framer-motion"
import {
  LayoutDashboard, Globe, ScrollText, AlertTriangle,
  Users, Activity, Settings, Zap,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"

const NAV_ITEMS = [
  { to: "/",          icon: LayoutDashboard, label: "Dashboard"  },
  { to: "/services",  icon: Globe,           label: "Services"   },
  { to: "/logs",      icon: ScrollText,      label: "Logs"       },
  { to: "/incidents", icon: AlertTriangle,   label: "Incidents"  },
  { to: "/team",      icon: Users,           label: "Team"       },
  { to: "/status",    icon: Activity,        label: "Status"     },
]

const sidebarVariants = {
  hidden:  { x: -80, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
}

const itemVariants = {
  hidden:  { x: -20, opacity: 0 },
  visible: (i) => ({
    x: 0, opacity: 1,
    transition: { delay: i * 0.05 + 0.2, duration: 0.3, ease: "easeOut" }
  })
}

export default function Sidebar() {
  const { user } = useAuth()
  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  return (
    <motion.aside
      variants={sidebarVariants} initial="hidden" animate="visible"
      className="relative h-screen w-60 flex-shrink-0 flex flex-col z-20"
      style={{ background: "rgba(6,9,18,0.95)", borderRight: "1px solid rgba(0,212,255,0.1)" }}>

      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg,transparent,#00d4ff,transparent)" }} />

      {/* Logo */}
      <div className="p-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,rgba(0,212,255,0.3),rgba(124,58,237,0.3))",
                border: "1px solid rgba(0,212,255,0.4)",
                boxShadow: "0 0 15px rgba(0,212,255,0.3)"
              }}>
              <Zap size={16} className="text-cyan-400" />
            </div>
            <span className="absolute inset-0 rounded-lg animate-ping-ring"
              style={{ border: "1px solid rgba(0,212,255,0.4)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none"
              style={{ fontFamily: "Orbitron", color: "#00d4ff", textShadow: "0 0 10px rgba(0,212,255,0.6)", letterSpacing: "0.12em" }}>
              AJ SENTINEL
            </h1>
            <p className="text-xs leading-none mt-1"
              style={{ color: "#334155", fontFamily: "JetBrains Mono", letterSpacing: "0.08em" }}>
              v2.4.1 — ONLINE
            </p>
          </div>
        </motion.div>
        <div className="mt-4 h-px"
          style={{ background: "linear-gradient(90deg,rgba(0,212,255,0.2),transparent)" }} />
      </div>

      {/* Status badge */}
      <div className="px-6 pb-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.15)" }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full"
              style={{ background: "#00ff88", opacity: 0.6 }} />
            <span className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: "#00ff88", boxShadow: "0 0 6px #00ff88" }} />
          </span>
          <span className="text-xs" style={{ color: "#00ff88", fontFamily: "JetBrains Mono", letterSpacing: "0.06em" }}>
            ALL SYSTEMS GO
          </span>
        </motion.div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-xs uppercase"
          style={{ color: "#1e293b", fontFamily: "JetBrains Mono", letterSpacing: "0.12em" }}>
          Navigation
        </p>
        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon
          return (
            <motion.div key={item.to} custom={i} variants={itemVariants} initial="hidden" animate="visible">
              <NavLink to={item.to} end={item.to === "/"}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                {({ isActive }) => (
                  <>
                    <Icon size={16} style={{ color: isActive ? "#00d4ff" : "#334155", flexShrink: 0 }} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.span layoutId="activeIndicator" className="ml-auto"
                        style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }} />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 mt-auto">
        <div className="h-px mb-4"
          style={{ background: "linear-gradient(90deg,rgba(0,212,255,0.1),transparent)" }} />
        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          {({ isActive }) => (
            <>
              <Settings size={16} style={{ color: isActive ? "#00d4ff" : "#334155" }} />
              <span>Settings</span>
            </>
          )}
        </NavLink>

        {/* User */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="flex items-center gap-3 mt-4 px-3 py-2 rounded-lg"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#00d4ff,#7c3aed)", fontFamily: "Orbitron", color: "#000" }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs truncate" style={{ color: "#94a3b8", fontFamily: "JetBrains Mono" }}>
              {user?.email || "operator@sentinel"}
            </p>
            <p className="text-xs" style={{ color: "#1e293b", fontFamily: "JetBrains Mono" }}>
              {user?.role?.toUpperCase() || "MEMBER"}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.aside>
  )
}
