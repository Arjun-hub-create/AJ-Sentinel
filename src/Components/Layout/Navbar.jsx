 import { useState, useEffect } from "react"
 import { motion } from "framer-motion"
 import { Search, Bell, RefreshCw, LogOut } from "lucide-react"
 import { useAuth } from "../../context/AuthContext"
 import { useWebSocket } from "../../hooks/useWebSocket"
 
 export default function Navbar({ title = "Dashboard" }) {
   const [time, setTime]           = useState(new Date())
   const [isRefreshing, setRefresh] = useState(false)
   const { user, logout }          = useAuth()
   const { isConnected }           = useWebSocket()
 
   useEffect(() => {
     const t = setInterval(() => setTime(new Date()), 1000)
     return () => clearInterval(t)
   }, [])
 
   const handleRefresh = () => {
     setRefresh(true)
     setTimeout(() => setRefresh(false), 1000)
     window.location.reload()
   }
 
   const formatTime = (d) =>
     d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
 
   const formatDate = (d) =>
     d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()
 
   // Initials from user name
   const initials = user?.name
     ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
     : "?"
 
   return (
     <motion.header
       initial={{ y: -20, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       transition={{ duration: 0.3, delay: 0.1 }}
       className="relative flex items-center justify-between px-6 h-14 flex-shrink-0 z-10"
       style={{
         background: "rgba(6,9,18,0.9)",
         borderBottom: "1px solid rgba(0,212,255,0.08)",
         backdropFilter: "blur(12px)",
       }}>
 
       {/* Left: Page title */}
       <div className="flex items-center gap-3">
         <div className="w-1 h-6 rounded-full"
           style={{ background: "linear-gradient(180deg,#00d4ff,#7c3aed)", boxShadow: "0 0 8px #00d4ff" }} />
         <span className="text-sm font-semibold uppercase tracking-widest"
           style={{ color: "#94a3b8", fontFamily: "Orbitron", letterSpacing: "0.15em" }}>
           {title}
         </span>
       </div>
 
       {/* Center: Search */}
       <div className="flex-1 max-w-xs mx-8 hidden md:block">
         <div className="relative">
           <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#334155" }} />
           <input type="text" placeholder="Search services, logs..."
             className="input-cyber pl-9 text-xs" style={{ height: 32 }} />
         </div>
       </div>
 
       {/* Right: Actions */}
       <div className="flex items-center gap-3">
 
         {/* Live clock */}
         <div className="hidden lg:flex flex-col items-end" style={{ fontFamily: "JetBrains Mono", lineHeight: 1 }}>
           <span className="text-sm font-semibold tabular-nums"
             style={{ color: "#00d4ff", textShadow: "0 0 8px rgba(0,212,255,0.5)" }}>
             {formatTime(time)}
           </span>
           <span className="text-xs mt-0.5" style={{ color: "#334155" }}>{formatDate(time)}</span>
         </div>
 
         <div className="w-px h-5 hidden lg:block" style={{ background: "rgba(255,255,255,0.06)" }} />
 
         {/* WebSocket status */}
         <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
           style={{
             background: isConnected ? "rgba(0,255,136,0.06)" : "rgba(255,51,102,0.06)",
             border: `1px solid ${isConnected ? "rgba(0,255,136,0.15)" : "rgba(255,51,102,0.15)"}`,
           }}>
           <span className="w-1.5 h-1.5 rounded-full" style={{
             background: isConnected ? "#00ff88" : "#ff3366",
             boxShadow: `0 0 6px ${isConnected ? "#00ff88" : "#ff3366"}`,
             animation: "pulse-dot 2s ease-in-out infinite",
           }} />
           <span style={{
             color: isConnected ? "#00ff88" : "#ff3366",
             fontFamily: "JetBrains Mono",
           }}>
             {isConnected ? "WS LIVE" : "WS OFFLINE"}
           </span>
         </div>
 
         {/* Refresh */}
         <button onClick={handleRefresh}
           className="p-2 rounded-lg transition-all hover:bg-white/5"
           style={{ color: "#334155" }}>
           <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.6 }}>
             <RefreshCw size={14} />
           </motion.div>
         </button>
 
         {/* Notification bell */}
         <button className="relative p-2 rounded-lg hover:bg-white/5 transition-all"
           style={{ color: "#334155" }}>
           <Bell size={14} />
           <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
             style={{ background: "#ff3366", boxShadow: "0 0 6px #ff3366",
               animation: "pulse-dot 2s ease-in-out infinite" }} />
         </button>
 
         <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.06)" }} />
 
         {/* User info + logout */}
         <div className="flex items-center gap-2">
           <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
             style={{
               background: "linear-gradient(135deg,#00d4ff,#7c3aed)",
               fontFamily: "Orbitron", color: "#000", fontSize: 11,
             }}>
             {initials}
           </div>
           <div className="hidden sm:block">
             <p className="text-xs leading-none" style={{ color: "#94a3b8", fontFamily: "JetBrains Mono" }}>
               {user?.name || "Operator"}
             </p>
             <p className="text-xs leading-none mt-0.5" style={{ color: "#334155", fontFamily: "JetBrains Mono" }}>
               {user?.role?.toUpperCase() || "MEMBER"}
             </p>
           </div>
           <button onClick={logout}
             className="p-2 rounded-lg hover:bg-red-500/10 transition-all ml-1"
             style={{ color: "#334155" }} title="Logout">
             <LogOut size={14} />
           </button>
         </div>
       </div>
     </motion.header>
   )
 }
 