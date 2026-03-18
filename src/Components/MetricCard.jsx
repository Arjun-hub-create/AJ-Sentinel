import { motion } from "framer-motion"

/**
 * @param {string}  title       - Card label
 * @param {string}  value       - Big number/value
 * @param {string}  subtitle    - Small detail text
 * @param {node}    icon        - Lucide icon component
 * @param {"cyan"|"green"|"red"|"purple"|"orange"} color
 * @param {string}  trend       - "+2.4%" style string
 * @param {boolean} trendUp     - true = green, false = red
 */
export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "cyan",
  trend,
  trendUp = true,
  delay = 0,
}) {
  const COLORS = {
    cyan:   { main: "#00d4ff", glow: "rgba(0,212,255,0.3)",   bg: "rgba(0,212,255,0.06)",   border: "rgba(0,212,255,0.2)"   },
    green:  { main: "#00ff88", glow: "rgba(0,255,136,0.3)",   bg: "rgba(0,255,136,0.06)",   border: "rgba(0,255,136,0.2)"   },
    red:    { main: "#ff3366", glow: "rgba(255,51,102,0.35)", bg: "rgba(255,51,102,0.06)",  border: "rgba(255,51,102,0.2)"  },
    purple: { main: "#a855f7", glow: "rgba(168,85,247,0.35)", bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.2)" },
    orange: { main: "#ff8c42", glow: "rgba(255,140,66,0.3)",  bg: "rgba(255,140,66,0.06)",  border: "rgba(255,140,66,0.2)"  },
  }

  const c = COLORS[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -3,
        boxShadow: `0 8px 30px ${c.glow}, 0 0 0 1px ${c.border}`,
        transition: { duration: 0.2 }
      }}
      className="relative overflow-hidden rounded-xl p-5 cursor-default"
      style={{
        background: "rgba(10, 14, 28, 0.8)",
        border: `1px solid rgba(255,255,255,0.06)`,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${c.main}, transparent)` }}
      />

      {/* Background icon watermark */}
      {Icon && (
        <div
          className="absolute -right-3 -bottom-3 pointer-events-none"
          style={{ opacity: 0.04 }}
        >
          <Icon size={80} color={c.main} />
        </div>
      )}

      {/* Header: Icon + Title */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "#475569", fontFamily: "JetBrains Mono" }}
          >
            {title}
          </p>
        </div>

        {Icon && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: c.bg, border: `1px solid ${c.border}` }}
          >
            <Icon size={18} color={c.main} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-3">
        <span
          className="text-3xl font-bold leading-none tabular-nums"
          style={{
            fontFamily: "Orbitron, monospace",
            color: c.main,
            textShadow: `0 0 20px ${c.glow}`,
          }}
        >
          {value}
        </span>

        {trend && (
          <span
            className="text-xs px-2 py-0.5 rounded mb-0.5"
            style={{
              background: trendUp ? "rgba(0,255,136,0.1)" : "rgba(255,51,102,0.1)",
              color: trendUp ? "#00ff88" : "#ff3366",
              fontFamily: "JetBrains Mono",
              border: `1px solid ${trendUp ? "rgba(0,255,136,0.2)" : "rgba(255,51,102,0.2)"}`,
            }}
          >
            {trend}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p
          className="text-xs mt-2"
          style={{ color: "#475569", fontFamily: "JetBrains Mono" }}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
