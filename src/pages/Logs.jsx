import { useState, useEffect, useRef, useCallback } from "react"
 import { motion, AnimatePresence } from "framer-motion"
 import { Search, Pause, Play, Trash2, Download, Terminal } from "lucide-react"
 import Layout from "../Components/Layout/Layout"
 import { logsService } from "../services/logsService"
 import { useWebSocket } from "../hooks/useWebSocket"
 
 const SERVICES_LIST = ["auth-api", "payment-api", "user-service", "webhook-worker", "cdn-edge", "db-replica"]
 
 const LEVEL_CFG = {
   error:   { color: "#ff3366", bg: "rgba(255,51,102,0.12)",  border: "rgba(255,51,102,0.25)",  dot: "#ff3366" },
   warn:    { color: "#ffd60a", bg: "rgba(255,214,10,0.12)",  border: "rgba(255,214,10,0.25)",  dot: "#ffd60a" },
   info:    { color: "#00d4ff", bg: "rgba(0,212,255,0.10)",   border: "rgba(0,212,255,0.25)",   dot: "#00d4ff" },
   debug:   { color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.25)", dot: "#64748b" },
   success: { color: "#00ff88", bg: "rgba(0,255,136,0.10)",   border: "rgba(0,255,136,0.25)",   dot: "#00ff88" },
 }
 
 const formatTs = (ts) => {
   const d = new Date(ts)
   return d.toLocaleTimeString("en-US", { hour12: false }) +
     "." + String(d.getMilliseconds()).padStart(3, "0")
 }
 
 const LogRow = ({ log, isNew }) => {
   const cfg = LEVEL_CFG[log.level] || LEVEL_CFG.info
   return (
     <motion.div
       initial={isNew ? { opacity: 0, x: -8, backgroundColor: `${cfg.color}18` } : { opacity: 1 }}
       animate={{ opacity: 1, x: 0, backgroundColor: "transparent" }}
       transition={{ duration: isNew ? 0.3 : 0 }}
       className="flex items-start gap-3 px-4 py-2 text-xs group hover:bg-white/[0.02] transition-colors"
       style={{ borderBottom: "1px solid rgba(255,255,255,0.025)", fontFamily: "JetBrains Mono" }}
     >
       <span className="flex-shrink-0 tabular-nums" style={{ color: "#334155", minWidth: 100 }}>
         {formatTs(log.timestamp || log.ts)}
       </span>
       <span className="flex-shrink-0 px-2 py-0.5 rounded uppercase font-medium text-center"
         style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 10, letterSpacing: "0.06em", minWidth: 52 }}>
         {log.level}
       </span>
       <span className="flex-shrink-0 px-2 py-0.5 rounded"
         style={{ background: "rgba(255,255,255,0.04)", color: "#64748b", fontSize: 10, minWidth: 80 }}>
         {log.service}
       </span>
       <span className="flex-1 leading-relaxed" style={{ color: "#94a3b8" }}>{log.message}</span>
       {log.id && (
         <span className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
           style={{ color: "#1e293b", fontSize: 10 }}>
           #{String(log.id).slice(-6)}
         </span>
       )}
     </motion.div>
   )
 }
 
 export default function Logs() {
   const [logs, setLogs]         = useState([])
   const [loading, setLoading]   = useState(true)
   const [paused, setPaused]     = useState(false)
   const [search, setSearch]     = useState("")
   const [levelFilter, setLevel] = useState("all")
   const [svcFilter, setSvc]     = useState("all")
   const [autoScroll, setAuto]   = useState(true)
   const [newIds, setNewIds]     = useState(new Set())
   const [counts, setCounts]     = useState({})
   const containerRef            = useRef(null)
   const { lastMessage }         = useWebSocket()
 
   // Load initial logs from API
   const loadLogs = useCallback(async () => {
     try {
       const params = { per_page: 100, hours: 24 }
       if (levelFilter !== "all") params.level   = levelFilter
       if (svcFilter   !== "all") params.service = svcFilter
       if (search)                params.search  = search
 
       const [logsData, statsData] = await Promise.all([
         logsService.list(params),
         logsService.stats(24),
       ])
       setLogs(logsData.items || [])
       setCounts(statsData || {})
     } catch {
       // Backend offline — start empty
     } finally {
       setLoading(false)
     }
   }, [levelFilter, svcFilter, search])
 
   useEffect(() => { loadLogs() }, [loadLogs])
 
   // Live logs from WebSocket
   useEffect(() => {
     if (!lastMessage || lastMessage.type !== "log" || paused) return
     const p = lastMessage.payload
     const newLog = {
       id:        `ws-${Date.now()}`,
       service:   p.service,
       level:     p.level,
       message:   p.message,
       timestamp: p.timestamp,
     }
 
     // Apply current filters
     const matchLevel = levelFilter === "all" || p.level === levelFilter
     const matchSvc   = svcFilter === "all"   || p.service === svcFilter
     const matchSearch = !search || p.message.toLowerCase().includes(search.toLowerCase())
     if (!matchLevel || !matchSvc || !matchSearch) return
 
     setLogs(prev => [newLog, ...prev.slice(0, 199)])
     setNewIds(prev => new Set([newLog.id, ...prev]))
     setCounts(prev => ({ ...prev, [p.level]: (prev[p.level] || 0) + 1 }))
   }, [lastMessage, paused, levelFilter, svcFilter, search])
 
   // Auto-scroll
   useEffect(() => {
     if (autoScroll && containerRef.current) {
       containerRef.current.scrollTop = 0
     }
   }, [logs, autoScroll])
 
   const handleDownload = () => {
     const text = logs.map(l =>
       `[${formatTs(l.timestamp || l.ts)}] [${l.level?.toUpperCase()}] [${l.service}] ${l.message}`
     ).join("\n")
     const blob = new Blob([text], { type: "text/plain" })
     const a = document.createElement("a")
     a.href = URL.createObjectURL(blob)
     a.download = `sentinel-logs-${Date.now()}.txt`
     a.click()
   }
 
   return (
     <Layout>
       {/* Header */}
       <div className="flex items-start justify-between mb-5">
         <div>
           <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
             className="text-xl font-bold uppercase"
             style={{ fontFamily: "Orbitron", color: "#e2e8f0", letterSpacing: "0.12em" }}>
             Log Explorer
           </motion.h1>
           <p className="text-xs mt-1" style={{ color: "#475569", fontFamily: "JetBrains Mono" }}>
             {logs.length} entries loaded — streaming live
           </p>
         </div>
         <div className="flex items-center gap-2">
           <button onClick={handleDownload}
             className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs hover:bg-white/5 transition-all"
             style={{ color: "#475569", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "JetBrains Mono" }}>
             <Download size={13} /> Export
           </button>
           <button onClick={() => setLogs([])}
             className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs hover:bg-red-500/10 transition-all"
             style={{ color: "#475569", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "JetBrains Mono" }}>
             <Trash2 size={13} /> Clear
           </button>
           <button onClick={() => setPaused(p => !p)}
             className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs transition-all"
             style={{
               fontFamily: "JetBrains Mono",
               background: paused ? "rgba(0,255,136,0.1)" : "rgba(255,51,102,0.1)",
               color: paused ? "#00ff88" : "#ff3366",
               border: `1px solid ${paused ? "rgba(0,255,136,0.25)" : "rgba(255,51,102,0.25)"}`,
             }}>
             {paused ? <><Play size={13} /> Resume</> : <><Pause size={13} /> Pause</>}
           </button>
         </div>
       </div>
 
       {/* Level Filters */}
       <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
         className="flex items-center gap-3 mb-4 flex-wrap">
         {["error","warn","info","debug","success"].map(lv => {
           const cfg = LEVEL_CFG[lv]
           return (
             <button key={lv} onClick={() => setLevel(levelFilter === lv ? "all" : lv)}
               className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
               style={{
                 fontFamily: "JetBrains Mono",
                 background: levelFilter === lv ? cfg.bg : "rgba(0,0,0,0.3)",
                 color: levelFilter === lv ? cfg.color : "#475569",
                 border: `1px solid ${levelFilter === lv ? cfg.border : "rgba(255,255,255,0.05)"}`,
               }}>
               <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
               {lv.toUpperCase()}
               <span className="tabular-nums" style={{ color: levelFilter === lv ? cfg.color : "#334155" }}>
                 {counts[lv] || 0}
               </span>
             </button>
           )
         })}
       </motion.div>
 
       {/* Search + Service Filter */}
       <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
         className="flex items-center gap-3 mb-4 flex-wrap">
         <div className="relative flex-1" style={{ maxWidth: 320 }}>
           <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#334155" }} />
           <input className="input-cyber pl-9 text-xs" style={{ height: 36 }}
             placeholder="Search messages..."
             value={search} onChange={e => setSearch(e.target.value)} />
         </div>
         <select className="input-cyber text-xs" style={{ height: 36, width: 160, cursor: "pointer" }}
           value={svcFilter} onChange={e => setSvc(e.target.value)}>
           <option value="all" style={{ background: "#0a0e1c" }}>All Services</option>
           {SERVICES_LIST.map(s => <option key={s} value={s} style={{ background: "#0a0e1c" }}>{s}</option>)}
         </select>
         <button onClick={() => setAuto(a => !a)}
           className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all"
           style={{
             fontFamily: "JetBrains Mono", height: 36,
             background: autoScroll ? "rgba(0,212,255,0.08)" : "rgba(0,0,0,0.3)",
             color: autoScroll ? "#00d4ff" : "#475569",
             border: `1px solid ${autoScroll ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.05)"}`,
           }}>
           <Terminal size={12} />
           Auto-scroll {autoScroll ? "ON" : "OFF"}
         </button>
       </motion.div>
 
       {/* Log Panel */}
       <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
         className="rounded-xl overflow-hidden"
         style={{ background: "rgba(4,7,14,0.95)", border: "1px solid rgba(0,212,255,0.08)" }}>
         {/* Panel header */}
         <div className="flex items-center justify-between px-4 py-2.5"
           style={{ borderBottom: "1px solid rgba(0,212,255,0.08)", background: "rgba(0,0,0,0.3)" }}>
           <div className="flex items-center gap-2">
             <Terminal size={13} style={{ color: "#00d4ff" }} />
             <span className="text-xs" style={{ color: "#64748b", fontFamily: "JetBrains Mono" }}>LIVE STREAM</span>
             {!paused && (
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute h-full w-full rounded-full" style={{ background: "#00ff88", opacity: 0.5 }} />
                 <span className="relative rounded-full h-2 w-2" style={{ background: "#00ff88" }} />
               </span>
             )}
           </div>
           <span className="text-xs tabular-nums" style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
             {logs.length} entries
           </span>
         </div>
 
         {/* Column headers */}
         <div className="flex items-center gap-3 px-4 py-2 text-xs"
           style={{ color: "#1e293b", fontFamily: "JetBrains Mono", background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
           <span style={{ minWidth: 100 }}>TIMESTAMP</span>
           <span style={{ minWidth: 52 }}>LEVEL</span>
           <span style={{ minWidth: 80 }}>SERVICE</span>
           <span className="flex-1">MESSAGE</span>
           <span>ID</span>
         </div>
 
         {/* Log list */}
         <div ref={containerRef} className="overflow-y-auto" style={{ height: 480 }}>
           {loading ? (
             <div className="flex items-center justify-center h-40"
               style={{ color: "#334155", fontFamily: "JetBrains Mono", fontSize: 13 }}>
               <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                 className="w-6 h-6 border-2 border-t-cyan-400 rounded-full mr-3"
                 style={{ borderColor: "rgba(0,212,255,0.2)", borderTopColor: "#00d4ff" }} />
               Loading logs...
             </div>
           ) : logs.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40"
               style={{ color: "#334155", fontFamily: "JetBrains Mono", fontSize: 13 }}>
               <Terminal size={24} style={{ marginBottom: 10, opacity: 0.3 }} />
               No logs yet — waiting for stream...
             </div>
           ) : (
             <AnimatePresence initial={false}>
               {logs.map(log => (
                 <LogRow key={log.id} log={log} isNew={newIds.has(log.id)} />
               ))}
             </AnimatePresence>
           )}
         </div>
       </motion.div>
     </Layout>
   )
 }
 