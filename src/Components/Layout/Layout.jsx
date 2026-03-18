import { motion, AnimatePresence } from "framer-motion"
import { useLocation } from "react-router-dom"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"
import ParticleBackground from "../ParticleBackground"

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

const PAGE_TITLES = {
  "/":          "Dashboard",
  "/services":  "Services",
  "/logs":      "Log Explorer",
  "/incidents": "Incidents",
  "/team":      "Team",
  "/status":    "Status",
  "/settings":  "Settings",
}

export default function Layout({ children, onNotifClick, unreadCount, notifPanel }) {
  const location = useLocation()
  const title    = PAGE_TITLES[location.pathname] || "AJ SENTINEL"

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#060912" }}>
      <ParticleBackground />

      {/* Ambient glows */}
      <div className="fixed top-0 left-60 w-96 h-96 rounded-full pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)", filter: "blur(40px)", transform: "translateY(-50%)" }} />
      <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />

      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <Navbar
          title={title}
          onNotifClick={onNotifClick}
          unreadCount={unreadCount}
          notifPanel={notifPanel}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="h-full p-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
