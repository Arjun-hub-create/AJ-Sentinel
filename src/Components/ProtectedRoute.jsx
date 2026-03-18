 import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  // Show nothing while verifying token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#060912" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "rgba(0,212,255,0.3)", borderTopColor: "#00d4ff" }}
          />
          <p style={{ color: "#334155", fontFamily: "JetBrains Mono", fontSize: 12 }}>
            AUTHENTICATING...
          </p>
        </div>
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
