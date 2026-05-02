import { Routes, Route } from 'react-router'
import { Toaster } from 'sonner'
import DashboardLayout from './components/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import SendMessage from './pages/SendMessage'
import BulkSend from './pages/BulkSend'
import Automation from './pages/Automation'
import Logs from './pages/Logs'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Setup from './pages/Setup'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/send" element={<SendMessage />} />
            <Route path="/bulk" element={<BulkSend />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
