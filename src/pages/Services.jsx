 import { useState, useEffect, useCallback } from "react"
 import { motion, AnimatePresence } from "framer-motion"
 import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts"
 import { Globe, Plus, X, Trash2, ExternalLink, Clock, Search, RefreshCw } from "lucide-react"
 import Layout from "../components/Layout/Layout"
 import { servicesService } from "../services/servicesService"
 import { useWebSocket } from "../hooks/useWebSocket"
 
 // ─── Config ───────────────────────────────────────────
 const STATUS_CFG = {
   online:   { color: "#00ff88", bg: "rgba(0,255,136,0.1)",  border: "rgba(0,255,136,0.2)",  label: "ONLINE"   },
   offline:  { color: "#ff3366", bg: "rgba(255,51,102,0.1)", border: "rgba(255,51,102,0.2)", label: "OFFLINE"  },
   degraded: { color: "#ff8c42", bg: "rgba(255,140,66,0.1)", border: "rgba(255,140,66,0.2)", label: "DEGRADED" },
   unknown:  { color: "#64748b", bg: "rgba(100,116,139,0.1)",border: "rgba(100,116,139,0.2)",label: "CHECKING" },
 }
 
 const TAG_CFG = {
   production:     { color: "#00d4ff", bg: "rgba(0,212,255,0.1)",  border: "rgba(0,212,255,0.2)"  },
   workers:        { color: "#a855f7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.2)" },
   infrastructure: { color: "#ffd60a", bg: "rgba(255,214,10,0.1)", border: "rgba(255,214,10,0.2)" },
   staging:        { color: "#64748b", bg: "rgba(100,116,139,0.1)",border: "rgba(100,116,139,0.2)"},
 }
 
 // ─── Sub-components ──────────────────────────────────
 
 const StatusDot = ({ status }) => {
   const c = STATUS_CFG[status] || STATUS_CFG.unknown
   return (
     <span className="relative flex" style={{ width: 8, height: 8, flexShrink: 0 }}>
       <span className="animate-ping absolute inline-flex h-full w-full rounded-full"
         style={{ background: c.color, opacity: 0.4 }} />
       <span className="relative inline-flex rounded-full"
         style={{ width: 8, height: 8, background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
     </span>
   )
 }
 
 const Spark = ({ data, status }) => {
   const color = status === "online" ? "#00d4ff" : status === "degraded" ? "#ff8c42" : "#ff3366"
   if (!data?.length || status === "offline") return (
     <div className="flex items-center justify-center h-9"
       style={{ color: "#1e293b", fontFamily: "JetBrains Mono", fontSize: 11 }}>
       — NO DATA —
     </div>
   )
   return (
     <ResponsiveContainer width="100%" height={36}>
       <LineChart data={data}>
         <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
         <Tooltip
           contentStyle={{ background: "rgba(10,14,28,0.9)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 6, fontFamily: "JetBrains Mono", fontSize: 10, padding: "4px 8px" }}
           formatter={v => [`${Math.round(v)}ms`]} labelFormatter={() => ""}
         />
       </LineChart>
     </ResponsiveContainer>
   )
 }
 
 // ─── Add Service Modal ─────────────────────────────
 const AddModal = ({ onClose, onAdd }) => {
   const [form, setForm]     = useState({ name: "", url: "", method: "GET", check_interval: "30", tag: "production" })
   const [loading, setLoading] = useState(false)
   const [error, setError]   = useState("")
 
   const handleSubmit = async (e) => {
     e.preventDefault()
     if (!form.name.trim()) return setError("Service name is required")
     if (!form.url.trim())  return setError("Endpoint URL is required")
     if (!form.url.startsWith("http")) return setError("URL must start with http:// or https://")
     setError("")
     setLoading(true)
     try {
       const created = await servicesService.create({ ...form, check_interval: Number(form.check_interval) })
       onAdd(created)
       onClose()
     } catch (err) {
       setError(err.response?.data?.detail || "Failed to add service")
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
         exit={{ opacity: 0, scale: 0.96, y: 20 }}
         transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
         className="w-full max-w-md rounded-2xl p-6 relative"
         style={{ background: "rgba(10,14,28,0.98)", border: "1px solid rgba(0,212,255,0.2)", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}
         onClick={e => e.stopPropagation()}>
 
         <div className="absolute top-0 left-12 right-12 h-px"
           style={{ background: "linear-gradient(90deg,transparent,#00d4ff,transparent)" }} />
 
         <div className="flex items-center justify-between mb-5">
           <div>
             <h2 className="text-sm font-bold uppercase tracking-widest"
               style={{ fontFamily: "Orbitron", color: "#00d4ff" }}>Add Service</h2>
             <p className="text-xs mt-0.5" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
               Configure a new endpoint to monitor
             </p>
           </div>
           <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "#475569" }}>
             <X size={16} />
           </button>
         </div>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           <div>
             <label className="block text-xs mb-1.5" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>SERVICE NAME</label>
             <input className="input-cyber" placeholder="e.g. Auth API"
               value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
           </div>
           <div>
             <label className="block text-xs mb-1.5" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>ENDPOINT URL</label>
             <input className="input-cyber" placeholder="https://api.example.com/health"
               value={form.url} onChange={e => setForm({...form, url: e.target.value})} />
           </div>
           <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="block text-xs mb-1.5" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>METHOD</label>
               <select className="input-cyber" value={form.method}
                 onChange={e => setForm({...form, method: e.target.value})} style={{ cursor: "pointer" }}>
                 {["GET","POST","HEAD"].map(m => <option key={m} value={m} style={{ background: "#0a0e1c" }}>{m}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-xs mb-1.5" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>INTERVAL</label>
               <select className="input-cyber" value={form.check_interval}
                 onChange={e => setForm({...form, check_interval: e.target.value})} style={{ cursor: "pointer" }}>
                 {[["30","30s"],["60","1m"],["120","2m"],["300","5m"]].map(([v,l]) =>
                   <option key={v} value={v} style={{ background: "#0a0e1c" }}>{l}</option>)}
               </select>
             </div>
           </div>
           <div>
             <label className="block text-xs mb-1.5" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>TAG</label>
             <select className="input-cyber" value={form.tag}
               onChange={e => setForm({...form, tag: e.target.value})} style={{ cursor: "pointer" }}>
               {["production","workers","infrastructure","staging"].map(t =>
                 <option key={t} value={t} style={{ background: "#0a0e1c" }}>{t}</option>)}
             </select>
           </div>
           {error && (
             <p className="text-xs px-3 py-2 rounded-lg" style={{
               color: "#ff3366", background: "rgba(255,51,102,0.08)",
               border: "1px solid rgba(255,51,102,0.2)", fontFamily: "JetBrains Mono"
             }}>{error}</p>
           )}
           <motion.button type="submit" className="btn-cyber-solid w-full mt-1"
             whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
             {loading ? (
               <span className="flex items-center justify-center gap-2">
                 <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                   className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
                 ADDING...
               </span>
             ) : "START MONITORING"}
           </motion.button>
         </form>
       </motion.div>
     </motion.div>
   )
 }
 
 // ─── Service Card ─────────────────────────────────────
 const ServiceCard = ({ service, onDelete, onCheck, index }) => {
   const s   = STATUS_CFG[service.status] || STATUS_CFG.unknown
   const tag = TAG_CFG[service.tag] || TAG_CFG.production
   const [checking, setChecking] = useState(false)
 
   const handleCheck = async () => {
     setChecking(true)
     try { await onCheck(service.id) }
     finally { setTimeout(() => setChecking(false), 1500) }
   }
 
   return (
     <motion.div layout
       initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, scale: 0.95 }}
       transition={{ delay: index * 0.04 }}
       whileHover={{ y: -3, transition: { duration: 0.15 } }}
       className="rounded-xl p-5 group relative overflow-hidden"
       style={{ background: "rgba(10,14,28,0.85)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
 
       <div className="absolute top-0 left-0 right-0 h-0.5"
         style={{ background: `linear-gradient(90deg,transparent,${s.color},transparent)`, opacity: 0.7 }} />
 
       {/* Header */}
       <div className="flex items-start justify-between mb-3">
         <div className="flex items-center gap-2.5 min-w-0 flex-1">
           <StatusDot status={service.status} />
           <div className="min-w-0">
             <p className="text-sm font-semibold truncate" style={{ color: "#e2e8f0", fontFamily: "JetBrains Mono" }}>
               {service.name}
             </p>
             <p className="text-xs truncate mt-0.5" style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
               {service.url?.replace("https://", "")}
             </p>
           </div>
         </div>
         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
           <button onClick={handleCheck} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "#475569" }}
             title="Run manual check">
             <motion.div animate={{ rotate: checking ? 360 : 0 }} transition={{ duration: 0.6 }}>
               <RefreshCw size={12} />
             </motion.div>
           </button>
           <a href={service.url} target="_blank" rel="noreferrer"
             className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "#475569" }}>
             <ExternalLink size={12} />
           </a>
           <button onClick={() => onDelete(service.id)}
             className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: "#475569" }}>
             <Trash2 size={12} />
           </button>
         </div>
       </div>
 
       {/* Sparkline (empty for new services) */}
       <div className="mb-3">
         <Spark data={service.spark || []} status={service.status} />
       </div>
 
       {/* Stats */}
       <div className="grid grid-cols-3 gap-2 mb-3">
         {[
           { label: "LATENCY", value: !service.latency_ms ? "—" : `${Math.round(service.latency_ms)}ms`,
             color: !service.latency_ms ? "#ff3366" : service.latency_ms > 200 ? "#ff8c42" : "#00d4ff" },
           { label: "UPTIME", value: service.uptime_percent != null ? `${service.uptime_percent}%` : "—",
             color: (service.uptime_percent ?? 100) > 99 ? "#00ff88" : (service.uptime_percent ?? 100) > 97 ? "#ff8c42" : "#ff3366" },
           { label: "METHOD", value: service.method || "GET", color: "#64748b" },
         ].map(stat => (
           <div key={stat.label} className="rounded-lg px-2 py-2 text-center" style={{ background: "rgba(0,0,0,0.3)" }}>
             <p className="font-semibold tabular-nums" style={{ color: stat.color, fontFamily: "JetBrains Mono", fontSize: 12 }}>
               {stat.value}
             </p>
             <p style={{ color: "#1e293b", fontFamily: "JetBrains Mono", fontSize: 9, marginTop: 2 }}>{stat.label}</p>
           </div>
         ))}
       </div>
 
       {/* Footer */}
       <div className="flex items-center justify-between pt-3"
         style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
         <span className="px-2 py-0.5 rounded" style={{
           background: tag.bg, color: tag.color, border: `1px solid ${tag.border}`,
           fontFamily: "JetBrains Mono", fontSize: 10
         }}>
           {service.tag}
         </span>
         <span className="flex items-center gap-1" style={{ color: "#334155", fontFamily: "JetBrains Mono", fontSize: 11 }}>
           <Clock size={10} />
           every {service.check_interval}s
         </span>
       </div>
     </motion.div>
   )
 }
 
 // ─── Main Page ───────────────────────────────────────
 export default function Services() {
   const [services, setServices]   = useState([])
   const [loading, setLoading]     = useState(true)
   const [showModal, setShowModal] = useState(false)
   const [search, setSearch]       = useState("")
   const [filter, setFilter]       = useState("all")
   const { lastMessage }           = useWebSocket()
 
   const loadServices = useCallback(async () => {
     try {
       const data = await servicesService.list()
       setServices(data)
     } catch {
       // Backend offline — keep empty list
     } finally {
       setLoading(false)
     }
   }, [])
 
   useEffect(() => { loadServices() }, [loadServices])
 
   // Live status updates from WebSocket
   useEffect(() => {
     if (!lastMessage || lastMessage.type !== "metric") return
     const p = lastMessage.payload
     setServices(prev => prev.map(s =>
       s.id === p.service_id
         ? { ...s, status: p.status, latency_ms: p.latency_ms }
         : s
     ))
   }, [lastMessage])
 
   const handleDelete = async (id) => {
     try {
       await servicesService.delete(id)
       setServices(prev => prev.filter(s => s.id !== id))
     } catch { /* silently fail */ }
   }
 
   const handleCheck = async (id) => {
     try {
       const result = await servicesService.triggerCheck(id)
       setServices(prev => prev.map(s =>
         s.id === id ? { ...s, status: result.result?.status || s.status, latency_ms: result.result?.latency_ms } : s
       ))
     } catch { /* silently fail */ }
   }
 
   const filtered = services.filter(s => {
     const q = search.toLowerCase()
     return (filter === "all" || s.status === filter) &&
            (s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q))
   })
 
   const counts = {
     all:      services.length,
     online:   services.filter(s => s.status === "online").length,
     degraded: services.filter(s => s.status === "degraded").length,
     offline:  services.filter(s => s.status === "offline").length,
   }
 
   return (
     <Layout>
       {/* Header */}
       <div className="flex items-start justify-between mb-6">
         <div>
           <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
             className="text-xl font-bold uppercase"
             style={{ fontFamily: "Orbitron", color: "#e2e8f0", letterSpacing: "0.12em" }}>
             Services
           </motion.h1>
           <p className="text-xs mt-1" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
             {counts.online} online · {counts.degraded} degraded · {counts.offline} offline
           </p>
         </div>
         <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
           onClick={() => setShowModal(true)}
           className="btn-cyber-solid flex items-center gap-2"
           whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
           <Plus size={14} /> Add Service
         </motion.button>
       </div>
 
       {/* Filter Bar */}
       <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
         className="flex flex-wrap items-center gap-3 mb-6">
         <div className="relative">
           <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#334155" }} />
           <input className="input-cyber pl-9 text-xs" style={{ height: 36, width: 220 }}
             placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} />
         </div>
         <div className="flex items-center gap-1 p-1 rounded-lg"
           style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)" }}>
           {[
             { key: "all",      label: `All (${counts.all})` },
             { key: "online",   label: `Online (${counts.online})` },
             { key: "degraded", label: `Degraded (${counts.degraded})` },
             { key: "offline",  label: `Offline (${counts.offline})` },
           ].map(({ key, label }) => (
             <button key={key} onClick={() => setFilter(key)}
               className="px-3 py-1 rounded-md text-xs transition-all"
               style={{
                 fontFamily: "JetBrains Mono",
                 background: filter === key ? "rgba(0,212,255,0.15)" : "transparent",
                 color: filter === key ? "#00d4ff" : "#475569",
                 border: filter === key ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent",
               }}>
               {label}
             </button>
           ))}
         </div>
       </motion.div>
 
       {/* Grid */}
       {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
           {Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="skeleton rounded-xl" style={{ height: 240 }} />
           ))}
         </div>
       ) : (
         <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
           <AnimatePresence>
             {filtered.length > 0
               ? filtered.map((svc, i) => (
                   <ServiceCard key={svc.id} service={svc} index={i}
                     onDelete={handleDelete} onCheck={handleCheck} />
                 ))
               : (
                 <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                   className="col-span-3 flex flex-col items-center justify-center py-20 rounded-xl"
                   style={{ border: "1px dashed rgba(0,212,255,0.12)" }}>
                   <Globe size={28} style={{ color: "#1e293b", marginBottom: 10 }} />
                   <p style={{ color: "#334155", fontFamily: "JetBrains Mono", fontSize: 13 }}>
                     {services.length === 0 ? "No services yet — add one to start monitoring" : "No services match"}
                   </p>
                 </motion.div>
               )
             }
           </AnimatePresence>
         </motion.div>
       )}
 
       <AnimatePresence>
         {showModal && (
           <AddModal onClose={() => setShowModal(false)}
             onAdd={svc => setServices(p => [svc, ...p])} />
         )}
       </AnimatePresence>
     </Layout>
   )
 }
 