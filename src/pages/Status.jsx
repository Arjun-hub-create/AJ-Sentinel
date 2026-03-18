import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Activity, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react"
import Layout from "../Components/Layout/Layout"
import api from "../services/api"

const STATUS_CFG = {
  online:   { color: "#00ff88", bg: "rgba(0,255,136,0.1)",  border: "rgba(0,255,136,0.2)",  label: "Operational",    icon: CheckCircle2  },
  degraded: { color: "#ff8c42", bg: "rgba(255,140,66,0.1)", border: "rgba(255,140,66,0.2)", label: "Degraded",       icon: AlertCircle   },
  offline:  { color: "#ff3366", bg: "rgba(255,51,102,0.1)", border: "rgba(255,51,102,0.2)", label: "Outage",         icon: XCircle       },
  unknown:  { color: "#64748b", bg: "rgba(100,116,139,0.1)",border: "rgba(100,116,139,0.2)",label: "Checking...",    icon: Clock         },
}

export default function Status() {
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [summary, setSummary]   = useState(null)

  const load = useCallback(async () => {
    try {
      const [svcRes, sumRes] = await Promise.all([
        api.get("/api/services"),
        api.get("/api/dashboard/summary"),
      ])
      setServices(svcRes.data || [])
      setSummary(sumRes.data)
    } catch {
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load])

  const allOnline = services.every(s => s.status === "online")
  const hasOffline = services.some(s => s.status === "offline")
  const hasDegraded = services.some(s => s.status === "degraded")

  const overallStatus = hasOffline ? "offline" : hasDegraded ? "degraded" : "online"
  const overallLabel  = hasOffline
    ? "Major Outage Detected"
    : hasDegraded
    ? "Partial Degradation"
    : "All Systems Operational"

  const overallColor = STATUS_CFG[overallStatus].color

  return (
    <Layout>
      <div className="mb-6">
        <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold uppercase"
          style={{ fontFamily: "Orbitron", color: "#e2e8f0", letterSpacing: "0.12em" }}>
          System Status
        </motion.h1>
        <p className="text-xs mt-1" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
          Real-time health of all monitored services
        </p>
      </div>

      {/* Overall status banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-6 mb-6 flex items-center gap-4"
        style={{
          background: `rgba(${overallStatus === "online" ? "0,255,136" : overallStatus === "degraded" ? "255,140,66" : "255,51,102"},0.06)`,
          border: `1px solid ${overallColor}30`,
        }}>
        <div className="relative flex-shrink-0">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute h-full w-full rounded-full"
              style={{ background: overallColor, opacity: 0.4 }} />
            <span className="relative rounded-full h-4 w-4"
              style={{ background: overallColor, boxShadow: `0 0 10px ${overallColor}` }} />
          </span>
        </div>
        <div>
          <p className="text-base font-bold" style={{ fontFamily: "Orbitron", color: overallColor }}>
            {overallLabel}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
            {services.length} services monitored · Last updated just now
          </p>
        </div>
        {summary && (
          <div className="ml-auto flex items-center gap-6">
            {[
              { label: "UPTIME", value: `${summary.uptime_percent ?? 100}%`, color: "#00ff88" },
              { label: "AVG LATENCY", value: `${summary.avg_latency_ms ?? 0}ms`, color: "#00d4ff" },
              { label: "INCIDENTS", value: summary.active_incidents ?? 0, color: "#ff8c42" },
            ].map(s => (
              <div key={s.label} className="text-center hidden md:block">
                <p className="text-lg font-bold" style={{ fontFamily: "Orbitron", color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Services list */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl overflow-hidden"
        style={{ background: "rgba(10,14,28,0.8)", border: "1px solid rgba(0,212,255,0.1)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(0,212,255,0.08)" }}>
          <h3 className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#94a3b8", fontFamily: "Orbitron" }}>Service Health</h3>
        </div>

        <div className="grid grid-cols-4 px-5 py-2 text-xs"
          style={{ color: "#334155", fontFamily: "JetBrains Mono", background: "rgba(0,0,0,0.2)" }}>
          <span>SERVICE</span><span>STATUS</span><span>LATENCY</span><span>UPTIME (30d)</span>
        </div>

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton mx-5 my-2 rounded-lg" style={{ height: 44 }} />
          ))
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16"
            style={{ color: "#334155", fontFamily: "JetBrains Mono", fontSize: 13 }}>
            <Activity size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
            No services added yet
          </div>
        ) : (
          services.map((svc, i) => {
            const cfg = STATUS_CFG[svc.status] || STATUS_CFG.unknown
            const Icon = cfg.icon
            return (
              <motion.div key={svc.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-4 px-5 py-4 text-xs items-center"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div>
                  <p style={{ color: "#e2e8f0", fontFamily: "JetBrains Mono", fontWeight: 500 }}>{svc.name}</p>
                  <p className="mt-0.5" style={{ color: "#334155", fontFamily: "JetBrains Mono", fontSize: 10 }}>
                    {svc.url?.replace("https://", "")}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit text-xs"
                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontFamily: "JetBrains Mono" }}>
                  <Icon size={11} />
                  {cfg.label}
                </span>
                <span style={{
                  color: !svc.latency_ms ? "#ff3366" : svc.latency_ms > 200 ? "#ff8c42" : "#00d4ff",
                  fontFamily: "JetBrains Mono"
                }}>
                  {svc.latency_ms ? `${Math.round(svc.latency_ms)}ms` : "—"}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-24"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-full rounded-full" style={{
                      width: `${svc.uptime_percent ?? 100}%`,
                      background: (svc.uptime_percent ?? 100) > 99 ? "#00ff88"
                        : (svc.uptime_percent ?? 100) > 97 ? "#ff8c42" : "#ff3366"
                    }} />
                  </div>
                  <span style={{ color: "#64748b", fontFamily: "JetBrains Mono" }}>
                    {svc.uptime_percent ?? 100}%
                  </span>
                </div>
              </motion.div>
            )
          })
        )}
      </motion.div>
    </Layout>
  )
}
