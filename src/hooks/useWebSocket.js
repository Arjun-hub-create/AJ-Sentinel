import { useState, useEffect, useRef, useCallback } from "react"

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws"
const RECONNECT_DELAY = 3000   // ms before reconnect attempt
const MAX_RECONNECTS  = 10

export function useWebSocket() {
  const [isConnected, setConnected]   = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [reconnects, setReconnects]   = useState(0)

  const wsRef        = useRef(null)
  const pingInterval = useRef(null)
  const reconnTimer  = useRef(null)

  const connect = useCallback(() => {
    // Don't reconnect if already open
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const token = localStorage.getItem("sentinel_token")
    const url   = token ? `${WS_URL}?token=${token}` : WS_URL

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setReconnects(0)
      // Send heartbeat every 30s so server knows we're alive
      pingInterval.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping")
      }, 30000)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type !== "pong") {
          setLastMessage(data)
        }
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onclose = () => {
      setConnected(false)
      clearInterval(pingInterval.current)

      // Auto-reconnect with backoff
      setReconnects(prev => {
        if (prev < MAX_RECONNECTS) {
          reconnTimer.current = setTimeout(connect, RECONNECT_DELAY)
          return prev + 1
        }
        return prev
      })
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearInterval(pingInterval.current)
      clearTimeout(reconnTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { isConnected, lastMessage, reconnects }
}
