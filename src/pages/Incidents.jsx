import { useState, useEffect, useCallback } from "react"
 import { motion, AnimatePresence } from "framer-motion"
 import {
   AlertTriangle, CheckCircle2, Clock, Zap,
   ChevronDown, ChevronUp, Activity, Plus, X
 } from "lucide-react"
 import Layout from "../components/Layout/Layout"
 import { incidentsService } from "../services/incidentsService"
 import { useWebSocket } from "../hooks/useWebSocket"
 
 // ─── Config ───────────────────────────────────────────
 const SEV_CFG = {
   critical: { color: "#ff3366", bg: "rgba(255,51,102,0.12)",  border: "rgba(255,51,102,0.3)",  label: "CRITICAL"  },
   high:     { color: "#ff8c42", bg: "rgba(255,140,66,0.12)",  border: "rgba(255,140,66,0.3)",  label: "HIGH"      },
   medium:   { color: "#ffd60a", bg: "rgba(255,214,10,0.12)",  border: "rgba(255,214,10,0.3)",  label: "MEDIUM"    },
   low:      { color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)", label: "LOW"       },
 }
 
 const STATUS_CFG = {
   active:        { color: "#ff3366", label: "ACTIVE",        icon: AlertTriangle  },
   investigating: { color: "#ff8c42", label: "INVESTIGATING", icon: Activity       },
   resolved:      { color: "#00ff88", label: "RESOLVED",      icon: CheckCircle2   },
 }
 
 const relativeTime = (ts) => {
   const diff = Date.now() - new Date(ts).getTime()
   const m = Math.floor(diff / 60000)
   const h = Math.floor(m / 60)
   const d = Math.floor(h / 24)
   if (m < 1)  return "just now"
   if (m < 60) return `${m}m ago`
   if (h < 24) return `${h}h ${m % 60}m ago`
   return `${d}d ago`
 }
 
 const duration = (start, end) => {
   const diff = (end ? new Date(end) : new Date()) - new Date(start)
   const m = Math.floor(diff / 60000)
   const h = Math.floor(m / 60)
   if (m < 60) return `${m}m`
   return `${h}h ${m % 60}m`
 }
 
 // ─── Add Update Modal ─────────────────────────────────
 const UpdateModal = ({ incidentId, onClose, onAdded }) => {
   const [text, setText]     = useState("")
   const [loading, setLoading] = useState(false)
   const [error, setError]   = useState("")
 
   const handleSubmit = async (e) => {
     e.preventDefault()
     if (!text.trim()) return setError("Update text is required")
     setLoading(true)
     try {
       await incidentsService.addUpdate(incidentId, text)
       onAdded()
       onClose()
     } catch (err) {
       setError(err.response?.data?.detail || "Failed to add update")
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
         transition={{ duration: 0.22, ease: [0.22,1,0.36,1] }}
         className="w-full max-w-md rounded-2xl p-6 relative"
         style={{ background: "rgba(10,14,28,0.98)", border: "1px solid rgba(0,212,255,0.2)", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}
         onClick={e => e.stopPropagation()}>
 
         <div className="absolute top-0 left-12 right-12 h-px"
           style={{ background: "linear-gradient(90deg,transparent,#00d4ff,transparent)" }} />
 
         <div className="flex items-center justify-between mb-5">
           <h2 className="text-sm font-bold uppercase tracking-widest"
             style={{ fontFamily: "Orbitron", color: "#00d4ff" }}>Add Update</h2>
           <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "#475569" }}>
             <X size={16} />
           </button>
         </div>
 
         <form onSubmit={handleSubmit} className="space-y-4">
           <div>
             <label className="block text-xs mb-1.5" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
               STATUS UPDATE
             </label>
             <textarea
               className="input-cyber resize-none"
               rows={4}
               placeholder="Describe what's happening, what you found, what actions are being taken..."
               value={text}
               onChange={e => setText(e.target.value)}
             />
           </div>
           {error && (
             <p className="text-xs px-3 py-2 rounded-lg" style={{
               color: "#ff3366", background: "rgba(255,51,102,0.08)",
               border: "1px solid rgba(255,51,102,0.2)", fontFamily: "JetBrains Mono"
             }}>{error}</p>
           )}
           <motion.button type="submit" className="btn-cyber-solid w-full"
             whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
             {loading ? (
               <span className="flex items-center justify-center gap-2">
                 <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                   className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
                 POSTING...
               </span>
             ) : "POST UPDATE"}
           </motion.button>
         </form>
       </motion.div>
     </motion.div>
   )
 }
 
 // ─── Incident Card ─────────────────────────────────
 const IncidentCard = ({ incident, index, onResolve, onUpdate }) => {
   const [expanded, setExpanded] = useState(incident.status !== "resolved")
   const [resolving, setResolving] = useState(false)
   const [showUpdateModal, setShowUpdateModal] = useState(false)
 
   const sev = SEV_CFG[incident.severity] || SEV_CFG.high
   const sts = STATUS_CFG[incident.status] || STATUS_CFG.active
   const StatusIcon = sts.icon
 
   const handleResolve = async () => {
     setResolving(true)
     try {
       await incidentsService.resolve(incident.id)
       onResolve(incident.id)
     } catch { /* silently fail */ }
     finally { setResolving(false) }
   }
 
   return (
     <>
       <motion.div layout
         initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
         transition={{ delay: index * 0.06 }}
         className="rounded-xl overflow-hidden"
         style={{ background: "rgba(10,14,28,0.85)", border: "1px solid rgba(255,255,255,0.06)" }}>
 
         {/* Severity top line */}
         <div className="h-0.5 w-full"
           style={{ background: `linear-gradient(90deg,transparent,${sev.color},transparent)` }} />
 
         {/* Header */}
         <div className="flex items-start justify-between p-5 cursor-pointer"
           onClick={() => setExpanded(e => !e)}>
           <div className="flex items-start gap-4 flex-1 min-w-0">
 
             {/* Live dot or resolved icon */}
             <div className="flex-shrink-0 mt-0.5">
               {incident.status === "active" ? (
                 <span className="relative flex h-3 w-3">
                   <span className="animate-ping absolute h-full w-full rounded-full"
                     style={{ background: sev.color, opacity: 0.5 }} />
                   <span className="relative rounded-full h-3 w-3"
                     style={{ background: sev.color, boxShadow: `0 0 8px ${sev.color}` }} />
                 </span>
               ) : (
                 <StatusIcon size={14} style={{ color: sts.color }} />
               )}
             </div>
 
             <div className="min-w-0 flex-1">
               {/* Badges row */}
               <div className="flex items-center gap-2 flex-wrap mb-1.5">
                 <span className="text-xs" style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
                   {incident.id}
                 </span>
                 <span className="px-2 py-0.5 rounded text-xs" style={{
                   background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`,
                   fontFamily: "JetBrains Mono", fontSize: 10, letterSpacing: "0.06em"
                 }}>
                   {sev.label}
                 </span>
                 <span className="px-2 py-0.5 rounded text-xs" style={{
                   background: incident.status === "resolved" ? "rgba(0,255,136,0.08)" : `${sev.bg}`,
                   color: sts.color,
                   border: `1px solid ${incident.status === "resolved" ? "rgba(0,255,136,0.2)" : sev.border}`,
                   fontFamily: "JetBrains Mono", fontSize: 10,
                 }}>
                   {sts.label}
                 </span>
                 {incident.service_name && (
                   <span className="px-2 py-0.5 rounded text-xs" style={{
                     background: "rgba(0,212,255,0.08)", color: "#00d4ff",
                     border: "1px solid rgba(0,212,255,0.2)",
                     fontFamily: "JetBrains Mono", fontSize: 10,
                   }}>
                     {incident.service_name}
                   </span>
                 )}
               </div>
 
               {/* Title */}
               <h3 className="text-sm font-medium mb-1.5"
                 style={{ color: "#e2e8f0", fontFamily: "JetBrains Mono" }}>
                 {incident.title}
               </h3>
 
               {/* Meta row */}
               <div className="flex items-center gap-4 flex-wrap text-xs"
                 style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
                 <span className="flex items-center gap-1">
                   <Clock size={11} />
                   Started {relativeTime(incident.started_at)}
                 </span>
                 <span className="flex items-center gap-1">
                   <Activity size={11} />
                   Duration: {duration(incident.started_at, incident.resolved_at)}
                 </span>
                 {incident.affected_users > 0 && (
                   <span style={{ color: "#334155" }}>
                     ~{incident.affected_users.toLocaleString()} affected
                   </span>
                 )}
               </div>
             </div>
           </div>
 
           <button className="ml-4 p-1 flex-shrink-0" style={{ color: "#334155" }}>
             {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
           </button>
         </div>
 
         {/* Expanded body */}
         <AnimatePresence initial={false}>
           {expanded && (
             <motion.div
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: "auto", opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
               style={{ overflow: "hidden" }}>
               <div className="px-5 pb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
 
                 {/* Description */}
                 {incident.description && (
                   <p className="text-xs mt-4 mb-5 leading-relaxed"
                     style={{ color: "#64748b", fontFamily: "JetBrains Mono" }}>
                     {incident.description}
                   </p>
                 )}
 
                 {/* Timeline */}
                 {incident.updates?.length > 0 && (
                   <div className="mb-5">
                     <p className="text-xs uppercase tracking-widest mb-3"
                       style={{ color: "#334155", fontFamily: "Orbitron" }}>Timeline</p>
                     <div className="space-y-0 relative">
                       <div className="absolute left-[7px] top-2 bottom-2 w-px"
                         style={{ background: "rgba(0,212,255,0.08)" }} />
 
                       {incident.updates.map((upd, i) => (
                         <motion.div key={i}
                           initial={{ opacity: 0, x: -8 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.05 }}
                           className="flex items-start gap-4 pb-4 last:pb-0">
                           <div className="flex-shrink-0 mt-1 relative z-10">
                             <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                               style={{
                                 background: i === 0 ? sev.color : "rgba(0,212,255,0.1)",
                                 border: `1px solid ${i === 0 ? sev.color : "rgba(0,212,255,0.3)"}`,
                               }}>
                               <div className="w-1.5 h-1.5 rounded-full"
                                 style={{ background: i === 0 ? "#000" : "#00d4ff" }} />
                             </div>
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-0.5">
                               <span className="text-xs tabular-nums"
                                 style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
                                 {relativeTime(upd.ts)}
                               </span>
                               <span className="text-xs" style={{ color: "#1e293b", fontFamily: "JetBrains Mono" }}>
                                 · {upd.author}
                               </span>
                             </div>
                             <p className="text-xs leading-relaxed"
                               style={{ color: "#64748b", fontFamily: "JetBrains Mono" }}>
                               {upd.text}
                             </p>
                           </div>
                         </motion.div>
                       ))}
                     </div>
                   </div>
                 )}
 
                 {/* Action buttons — only for active/investigating */}
                 {incident.status !== "resolved" && (
                   <div className="flex gap-2 flex-wrap">
                     <button
                       onClick={() => setShowUpdateModal(true)}
                       className="btn-cyber text-xs flex items-center gap-1.5">
                       <Plus size={12} /> Add Update
                     </button>
                     <motion.button
                       onClick={handleResolve}
                       disabled={resolving}
                       className="text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all"
                       style={{
                         background: "rgba(0,255,136,0.1)", color: "#00ff88",
                         border: "1px solid rgba(0,255,136,0.2)",
                         fontFamily: "Orbitron", fontSize: 11, letterSpacing: "0.08em",
                         cursor: resolving ? "wait" : "pointer",
                       }}
                       whileHover={{ scale: resolving ? 1 : 1.02 }}
                       whileTap={{ scale: 0.98 }}>
                       {resolving ? (
                         <span className="flex items-center gap-2">
                           <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                             className="inline-block w-3 h-3 border border-green-400/30 border-t-green-400 rounded-full" />
                           RESOLVING...
                         </span>
                       ) : (
                         <><CheckCircle2 size={12} /> Mark Resolved</>
                       )}
                     </motion.button>
                   </div>
                 )}
               </div>
             </motion.div>
           )}
         </AnimatePresence>
       </motion.div>
 
       {/* Update Modal */}
       <AnimatePresence>
         {showUpdateModal && (
           <UpdateModal
             incidentId={incident.id}
             onClose={() => setShowUpdateModal(false)}
             onAdded={onUpdate}
           />
         )}
       </AnimatePresence>
     </>
   )
 }
 
 // ─── Main Page ───────────────────────────────────────
 export default function Incidents() {
   const [incidents, setIncidents] = useState([])
   const [loading, setLoading]     = useState(true)
   const [filter, setFilter]       = useState("all")
   const { lastMessage }           = useWebSocket()
 
   const loadIncidents = useCallback(async () => {
     try {
       const data = await incidentsService.list()
       setIncidents(data.items || [])
     } catch {
       setIncidents([])
     } finally {
       setLoading(false)
     }
   }, [])
 
   useEffect(() => { loadIncidents() }, [loadIncidents])
 
   // Auto-refresh every 60s
   useEffect(() => {
     const id = setInterval(loadIncidents, 60000)
     return () => clearInterval(id)
   }, [loadIncidents])
 
   // New incident from WebSocket
   useEffect(() => {
     if (!lastMessage || lastMessage.type !== "incident") return
     // Refresh the full list when a new incident is auto-detected
     loadIncidents()
   }, [lastMessage, loadIncidents])
 
   const handleResolve = (id) => {
     setIncidents(prev => prev.map(inc =>
       inc.id === id
         ? { ...inc, status: "resolved", resolved_at: new Date().toISOString() }
         : inc
     ))
   }
 
   const filtered = incidents.filter(i =>
     filter === "all" ||
     (filter === "active"   && i.status !== "resolved") ||
     (filter === "resolved" && i.status === "resolved")
   )
 
   const active   = incidents.filter(i => i.status !== "resolved")
   const resolved = incidents.filter(i => i.status === "resolved")
 
   // MTTR calculation
   const resolvedWithDuration = incidents.filter(i => i.resolved_at)
   const avgMttrMs = resolvedWithDuration.length
     ? resolvedWithDuration.reduce((sum, i) =>
         sum + (new Date(i.resolved_at) - new Date(i.started_at)), 0
       ) / resolvedWithDuration.length
     : 0
   const avgMttrMin = Math.floor(avgMttrMs / 60000)
   const mttrDisplay = avgMttrMin > 0 ? `${avgMttrMin}m` : "—"
 
   return (
     <Layout>
       {/* Header */}
       <div className="flex items-start justify-between mb-6">
         <div>
           <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
             className="text-xl font-bold uppercase"
             style={{ fontFamily: "Orbitron", color: "#e2e8f0", letterSpacing: "0.12em" }}>
             Incidents
           </motion.h1>
           <p className="text-xs mt-1" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
             {active.length} active · {resolved.length} resolved · MTTR {mttrDisplay}
           </p>
         </div>
       </div>
 
       {/* Stats Row */}
       <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
         className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
         {[
           { label: "Active Now",     value: active.length,    color: "#ff3366" },
           { label: "Total Today",    value: incidents.length, color: "#ff8c42" },
           { label: "Resolved",       value: resolved.length,  color: "#00ff88" },
           { label: "Avg MTTR",       value: mttrDisplay,      color: "#00d4ff" },
         ].map((s, i) => (
           <motion.div key={s.label}
             initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
             className="rounded-xl px-4 py-3"
             style={{ background: "rgba(10,14,28,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
             <p className="text-xl font-bold tabular-nums"
               style={{ fontFamily: "Orbitron", color: s.color }}>
               {s.value}
             </p>
             <p className="text-xs mt-0.5" style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
               {s.label}
             </p>
           </motion.div>
         ))}
       </motion.div>
 
       {/* Filter Tabs */}
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
         className="flex items-center gap-1 p-1 rounded-lg mb-5 w-fit"
         style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)" }}>
         {[
           { key: "all",      label: `All (${incidents.length})` },
           { key: "active",   label: `Active (${active.length})` },
           { key: "resolved", label: `Resolved (${resolved.length})` },
         ].map(({ key, label }) => (
           <button key={key} onClick={() => setFilter(key)}
             className="px-4 py-1.5 rounded-md text-xs transition-all"
             style={{
               fontFamily: "JetBrains Mono",
               background: filter === key ? "rgba(0,212,255,0.15)" : "transparent",
               color: filter === key ? "#00d4ff" : "#475569",
               border: filter === key ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent",
             }}>
             {label}
           </button>
         ))}
       </motion.div>
 
       {/* Incidents List */}
       {loading ? (
         <div className="space-y-3">
           {Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="skeleton rounded-xl" style={{ height: 88 }} />
           ))}
         </div>
       ) : filtered.length === 0 ? (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
           className="flex flex-col items-center justify-center py-20 rounded-xl"
           style={{ border: "1px dashed rgba(0,212,255,0.12)" }}>
           <CheckCircle2 size={28} style={{ color: "#00ff88", marginBottom: 10, opacity: 0.5 }} />
           <p style={{ color: "#334155", fontFamily: "JetBrains Mono", fontSize: 13 }}>
             All clear — no incidents
           </p>
         </motion.div>
       ) : (
         <div className="space-y-3">
           <AnimatePresence>
             {filtered.map((incident, i) => (
               <IncidentCard
                 key={incident.id}
                 incident={incident}
                 index={i}
                 onResolve={handleResolve}
                 onUpdate={loadIncidents}
               />
             ))}
           </AnimatePresence>
         </div>
       )}
     </Layout>
   )
 }
 