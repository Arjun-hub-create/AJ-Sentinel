import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Login     from "./pages/Login"
import Register  from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Services  from "./pages/Services"
import Logs      from "./pages/Logs"
import Incidents from "./pages/Incidents"
import Team      from "./pages/Team"
import Status    from "./pages/Status"
import Settings  from "./pages/Settings"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/"          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/services"  element={<ProtectedRoute><Services /></ProtectedRoute>} />
          <Route path="/logs"      element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />
          <Route path="/team"      element={<ProtectedRoute><Team /></ProtectedRoute>} />
          <Route path="/status"    element={<ProtectedRoute><Status /></ProtectedRoute>} />
          <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
