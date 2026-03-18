import { useState, useEffect, useCallback } from "react"
 import { motion } from "framer-motion"
 import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid,
   Tooltip, ResponsiveContainer, BarChart, Bar, Cell
 } from "recharts"
 import { Globe, AlertTriangle, Activity, Zap } from "lucide-react"
 import Layout from "../components/Layout/Layout"
 import MetricCard from "../components/MetricCard"
 import { dashboardService } from "../services/dashboardService"
 import { useWebSocket } from "../hooks/useWebSocket"
 
 // ─── Fallback mock data (shown while loading or if backend is offline) ──
 const MOCK_LATENCY = Array.from({ length: 24 }, (_, i) => ({
   time: `${String(i).padStart(2, "0")}:00`,
   p50:  Math.floor(Math.random() * 40 + 20),
   p95:  Math.floor(Math.random() * 80 + 60),
   p99:  Math.floor(Math.random() * 120 + 100),
 }))
 
 const MOCK_UPTIME = [
   { day: "Mon", uptime: 99.98 }, { day: "Tue", uptime: 99.91 },
   { day: "Wed", uptime: 95.20 }, { day: "Thu", uptime: 99.87 },
   { day: "Fri", uptime: 99.99 }, { day: "Sat", uptime: 98.50 },
   { day: "Sun", uptime: 99.95 },
 ]
 
 const MOCK_SERVICES = [
   { id: 1, name: "Auth API",       url: "api.sentinel.io/auth",     status: "online",   latency_ms: 42,  uptime_percent: 99.98 },
   { id: 2, name: "Payment API",    url: "api.sentinel.io/payments", status: "online",   latency_ms: 118, uptime_percent: 99.91 },
   { id: 3, name: "User Service",   url: "api.sentinel.io/users",    status: "degraded", latency_ms: 342, uptime_percent: 98.41 },
   { id: 4, name: "Webhook Worker", url: "workers.sentinel.io",      status: "offline",  latency_ms: 0,   uptime_percent: 94.20 },
   { id: 5, name: "CDN Edge",       url: "cdn.sentinel.io",          status: "online",   latency_ms: 8,   uptime_percent: 99.99 },
 ]
 
 // ─── Sub-components ──────────────────────────────────
 
 const StatusBadge = ({ status }) => {
   const map = {
     online:   { color: "#00ff88", bg: "rgba(0,255,136,0.1)",  border: "rgba(0,255,136,0.2)",  label: "ONLINE"   },
     offline:  { color: "#ff3366", bg: "rgba(255,51,102,0.1)", border: "rgba(255,51,102,0.2)", label: "OFFLINE"  },
     degraded: { color: "#ff8c42", bg: "rgba(255,140,66,0.1)", border: "rgba(255,140,66,0.2)", label: "DEGRADED" },
   }
   const s = map[status] || map.online
   return (
     <span className="text-xs px-2 py-0.5 rounded" style={{
       background: s.bg, color: s.color, border: `1px solid ${s.border}`,
       fontFamily: "JetBrains Mono", letterSpacing: "0.06em"
     }}>
       {s.label}
     </span>
   )
 }
 
 const CustomTooltip = ({ active, payload, label }) => {
   if (!active || !payload?.length) return null
   return (
     <div className="rounded-lg p-3 text-xs" style={{
       background: "rgba(10,14,28,0.95)", border: "1px solid rgba(0,212,255,0.2)", fontFamily: "JetBrains Mono",
     }}>
       <p style={{ color: "#64748b" }} className="mb-1">{label}</p>
       {payload.map(p => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}ms</p>)}
     </div>
   )
 }
 
 // ─── Skeleton loader for cards ────────────────────────
 const CardSkeleton = () => (
   <div className="skeleton rounded-xl" style={{ height: 120 }} />
 )
 
 // ─── Main Page ───────────────────────────────────────
 export default function Dashboard() {
   const [summary, setSummary]     = useState(null)
   const [loading, setLoading]     = useState(true)
   const [services, setServices]   = useState(MOCK_SERVICES)
   const [recentLogs, setLogs]     = useState([])
   const [latencyData, setLatency] = useState(MOCK_LATENCY)
   const { lastMessage, isConnected } = useWebSocket()
 
   // ── Load dashboard summary from API ──────────────
   const loadSummary = useCallback(async () => {
     try {
       const data = await dashboardService.summary()
       setSummary(data)
       if (data.latency_chart?.length)  setLatency(data.latency_chart)
       if (data.recent_logs?.length)    setLogs(data.recent_logs)
     } catch {
       // Backend not running — fallback to mock data silently
       setSummary(null)
     } finally {
       setLoading(false)
     }
   }, [])
 
   useEffect(() => { loadSummary() }, [loadSummary])
 
   // Auto-refresh every 30 seconds
   useEffect(() => {
     const id = setInterval(loadSummary, 30000)
     return () => clearInterval(id)
   }, [loadSummary])
 
   // ── Handle live WebSocket messages ────────────────
   useEffect(() => {
     if (!lastMessage) return
 
     if (lastMessage.type === "metric") {
       // Update the matching service's status live
       const p = lastMessage.payload
       setServices(prev => prev.map(s =>
         String(s.id) === String(p.service_id)
           ? { ...s, status: p.status, latency_ms: p.latency_ms }
           : s
       ))
     }
 
     if (lastMessage.type === "log") {
       const p = lastMessage.payload
       setLogs(prev => [
         { level: p.level, service: p.service, message: p.message, ts: p.timestamp },
         ...prev.slice(0, 19)
       ])
     }
   }, [lastMessage])
 
   // ── Derived stats ─────────────────────────────────
   const svcs        = summary?.services || { online: 3, offline: 1, degraded: 1, total: 5 }
   const uptime      = summary?.uptime_percent ?? 99.8
   const avgLatency  = summary?.avg_latency_ms ?? 67
   const activeInc   = summary?.active_incidents ?? 2
 
   return (
     <Layout>
       {/* Header */}
       <div className="flex items-center justify-between mb-6">
         <div>
           <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
             className="text-xl font-bold uppercase"
             style={{ fontFamily: "Orbitron", color: "#e2e8f0", letterSpacing: "0.12em" }}>
             System Overview
           </motion.h1>
           <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
             className="text-xs mt-1" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
             Real-time monitoring — auto-refresh every 30s
           </motion.p>
         </div>
 
         {/* Live / Offline badge */}
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
           className="flex items-center gap-2 px-4 py-2 rounded-lg"
           style={{
             background: isConnected ? "rgba(0,212,255,0.06)" : "rgba(255,51,102,0.06)",
             border: `1px solid ${isConnected ? "rgba(0,212,255,0.15)" : "rgba(255,51,102,0.15)"}`,
           }}>
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute h-full w-full rounded-full"
               style={{ background: isConnected ? "#00d4ff" : "#ff3366", opacity: 0.5 }} />
             <span className="relative rounded-full h-2 w-2"
               style={{ background: isConnected ? "#00d4ff" : "#ff3366" }} />
           </span>
           <span className="text-xs" style={{
             color: isConnected ? "#00d4ff" : "#ff3366", fontFamily: "JetBrains Mono"
           }}>
             {isConnected ? "LIVE" : "OFFLINE"}
           </span>
         </motion.div>
       </div>
 
       {/* Metric Cards */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
         {loading ? (
           Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
         ) : (
           <>
             <MetricCard title="Services Online"  value={`${svcs.online}/${svcs.total}`}      subtitle={`${svcs.degraded} degraded · ${svcs.offline} offline`} icon={Globe}         color="cyan"   delay={0}    trend="+1"    trendUp={true}  />
             <MetricCard title="Avg Latency"      value={`${avgLatency}ms`}                   subtitle="p95 tracked"                                            icon={Zap}           color="purple" delay={0.05} trend="-12ms" trendUp={true}  />
             <MetricCard title="Active Incidents" value={String(activeInc)}                   subtitle="auto-detected"                                          icon={AlertTriangle}  color="red"    delay={0.1}  trend={`+${activeInc}`} trendUp={false} />
             <MetricCard title="Overall Uptime"   value={`${uptime}%`}                        subtitle="Last 30 days"                                           icon={Activity}      color="green"  delay={0.15} trend="↓0.02%" trendUp={false} />
           </>
         )}
       </div>
 
       {/* Charts Row */}
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
 
         {/* Latency Chart */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
           className="xl:col-span-2 rounded-xl p-5"
           style={{ background: "rgba(10,14,28,0.8)", border: "1px solid rgba(0,212,255,0.1)", backdropFilter: "blur(12px)" }}>
           <div className="flex items-center justify-between mb-4">
             <div>
               <h3 className="text-xs font-semibold uppercase tracking-widest"
                 style={{ color: "#94a3b8", fontFamily: "Orbitron" }}>Response Latency</h3>
               <p className="text-xs mt-0.5" style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
                 24h — p50 / p95 / p99
               </p>
             </div>
             <div className="flex items-center gap-4 text-xs" style={{ fontFamily: "JetBrains Mono" }}>
               {[{ label:"p50", color:"#00d4ff" },{ label:"p95", color:"#7c3aed" },{ label:"p99", color:"#ff8c42" }].map(l => (
                 <span key={l.label} className="flex items-center gap-1.5">
                   <span className="w-3 h-0.5 rounded" style={{ background: l.color }} />
                   <span style={{ color: "#475569" }}>{l.label}</span>
                 </span>
               ))}
             </div>
           </div>
           <ResponsiveContainer width="100%" height={200}>
             <AreaChart data={latencyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
               <defs>
                 <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} /><stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                 </linearGradient>
                 <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.25} /><stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                 </linearGradient>
                 <linearGradient id="go" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="#ff8c42" stopOpacity={0.2} /><stop offset="100%" stopColor="#ff8c42" stopOpacity={0} />
                 </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" />
               <XAxis dataKey="time" tick={{ fill:"#334155", fontSize:10, fontFamily:"JetBrains Mono" }} axisLine={false} tickLine={false} interval={3} />
               <YAxis tick={{ fill:"#334155", fontSize:10, fontFamily:"JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}ms`} />
               <Tooltip content={<CustomTooltip />} />
               <Area type="monotone" dataKey="p50" name="p50" stroke="#00d4ff" strokeWidth={2} fill="url(#gc)" dot={false} />
               <Area type="monotone" dataKey="p95" name="p95" stroke="#7c3aed" strokeWidth={1.5} fill="url(#gp)" dot={false} />
               <Area type="monotone" dataKey="p99" name="p99" stroke="#ff8c42" strokeWidth={1}   fill="url(#go)" dot={false} />
             </AreaChart>
           </ResponsiveContainer>
         </motion.div>
 
         {/* Uptime Bar Chart */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
           className="rounded-xl p-5"
           style={{ background: "rgba(10,14,28,0.8)", border: "1px solid rgba(0,212,255,0.1)", backdropFilter: "blur(12px)" }}>
           <h3 className="text-xs font-semibold uppercase tracking-widest mb-1"
             style={{ color: "#94a3b8", fontFamily: "Orbitron" }}>Weekly Uptime</h3>
           <p className="text-xs mb-4" style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>Last 7 days</p>
           <ResponsiveContainer width="100%" height={200}>
             <BarChart data={MOCK_UPTIME} margin={{ top: 5, right: 5, bottom: 0, left: -30 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" />
               <XAxis dataKey="day" tick={{ fill:"#334155", fontSize:10, fontFamily:"JetBrains Mono" }} axisLine={false} tickLine={false} />
               <YAxis domain={[90,100]} tick={{ fill:"#334155", fontSize:10, fontFamily:"JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
               <Tooltip
                 contentStyle={{ background:"rgba(10,14,28,0.95)", border:"1px solid rgba(0,212,255,0.2)", borderRadius:8, fontFamily:"JetBrains Mono", fontSize:11, color:"#94a3b8" }}
                 formatter={v => [`${Number(v).toFixed(2)}%`, "Uptime"]}
               />
               <Bar dataKey="uptime" radius={[4,4,0,0]}>
                 {MOCK_UPTIME.map((entry, i) => (
                   <Cell key={`cell-${i}`} fill={entry.uptime > 99 ? "#00d4ff" : entry.uptime > 97 ? "#ff8c42" : "#ff3366"} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
         </motion.div>
       </div>
 
       {/* Services Table — updates live via WebSocket */}
       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
         className="mb-4 rounded-xl overflow-hidden"
         style={{ background: "rgba(10,14,28,0.8)", border: "1px solid rgba(0,212,255,0.1)" }}>
         <div className="flex items-center justify-between px-5 py-3"
           style={{ borderBottom: "1px solid rgba(0,212,255,0.08)" }}>
           <h3 className="text-xs font-semibold uppercase tracking-widest"
             style={{ color: "#94a3b8", fontFamily: "Orbitron" }}>Monitored Services</h3>
           <a href="/services" className="text-xs px-3 py-1 rounded-lg transition-all" style={{
             color: "#00d4ff", background: "rgba(0,212,255,0.08)",
             border: "1px solid rgba(0,212,255,0.2)", fontFamily: "JetBrains Mono",
           }}>
             Manage →
           </a>
         </div>
         <div className="grid grid-cols-5 px-5 py-2 text-xs"
           style={{ color: "#334155", fontFamily: "JetBrains Mono", background: "rgba(0,0,0,0.2)" }}>
           <span>SERVICE</span><span>ENDPOINT</span><span>STATUS</span><span>LATENCY</span><span>UPTIME (30d)</span>
         </div>
         {services.map((svc, i) => (
           <motion.div key={svc.id}
             layout
             initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.3 + i * 0.05 }}
             className="grid grid-cols-5 px-5 py-3 text-xs items-center"
             style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
             whileHover={{ backgroundColor: "rgba(0,212,255,0.025)" }}>
             <span style={{ color: "#e2e8f0", fontFamily: "JetBrains Mono", fontWeight: 500 }}>{svc.name}</span>
             <span style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
               {(svc.url || "").replace("https://", "")}
             </span>
             <span><StatusBadge status={svc.status} /></span>
             <span style={{
               color: !svc.latency_ms ? "#ff3366" : svc.latency_ms > 200 ? "#ff8c42" : "#00d4ff",
               fontFamily: "JetBrains Mono"
             }}>
               {!svc.latency_ms ? "—" : `${svc.latency_ms}ms`}
             </span>
             <div className="flex items-center gap-2">
               <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                 style={{ background: "rgba(255,255,255,0.05)" }}>
                 <div className="h-full rounded-full" style={{
                   width: `${svc.uptime_percent ?? 100}%`,
                   background: (svc.uptime_percent ?? 100) > 99 ? "#00ff88"
                     : (svc.uptime_percent ?? 100) > 97 ? "#ff8c42" : "#ff3366"
                 }} />
               </div>
               <span style={{ color: "#64748b", fontFamily: "JetBrains Mono", minWidth: 42 }}>
                 {svc.uptime_percent ?? "—"}%
               </span>
             </div>
           </motion.div>
         ))}
       </motion.div>
 
       {/* Recent Activity — updates live via WebSocket */}
       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
         className="rounded-xl p-5"
         style={{ background: "rgba(10,14,28,0.8)", border: "1px solid rgba(0,212,255,0.1)" }}>
         <h3 className="text-xs font-semibold uppercase tracking-widest mb-4"
           style={{ color: "#94a3b8", fontFamily: "Orbitron" }}>
           Recent Activity
         </h3>
 
         {recentLogs.length === 0 ? (
           <p className="text-xs py-4 text-center" style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
             No recent activity — logs will appear here in real-time
           </p>
         ) : (
           <div className="space-y-3">
             {recentLogs.slice(0, 10).map((log, i) => {
               const timeStr = log.ts
                 ? new Date(log.ts).toLocaleTimeString("en-US", { hour12: false })
                 : "—"
               return (
                 <motion.div key={i}
                   initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.5 + i * 0.03 }}
                   className="flex items-start gap-3 text-xs">
                   <span style={{ color: "#334155", fontFamily: "JetBrains Mono", minWidth: 64 }}>
                     {timeStr}
                   </span>
                   <span className={`badge badge-${log.level} flex-shrink-0`}>{log.level}</span>
                   <span style={{ color: "#475569", fontFamily: "JetBrains Mono", minWidth: 80 }}>
                     {log.service}
                   </span>
                   <span style={{ color: "#64748b", fontFamily: "JetBrains Mono" }}>{log.message}</span>
                 </motion.div>
               )
             })}
           </div>
         )}
       </motion.div>
     </Layout>
   )
 }
 