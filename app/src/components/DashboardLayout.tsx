import { Outlet, NavLink } from 'react-router'
import { 
  LayoutDashboard, 
  Smartphone, 
  Send, 
  Mails, 
  Bot, 
  ClipboardList, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/accounts', label: 'Accounts', icon: Smartphone },
  { path: '/send', label: 'Send Message', icon: Send },
  { path: '/bulk', label: 'Bulk Send', icon: Mails },
  { path: '/automation', label: 'Automation', icon: Bot },
  { path: '/logs', label: 'Logs', icon: ClipboardList },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout, user } = useAuth()

  return (
    <div className="flex h-screen bg-transparent text-foreground font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 glass-card rounded-r-3xl lg:rounded-none lg:rounded-r-[2.5rem] border-r border-white/10
          transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl lg:shadow-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col m-0 lg:m-4 lg:mr-0
        `}
      >
        <div className="flex items-center justify-between p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <Send className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-400">WA Auto</h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/5 text-green-600 dark:text-emerald-400 border border-green-500/20 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110`} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mb-4">
          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/5 text-green-600 dark:text-emerald-400 border border-green-500/20 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
              }`
            }
          >
            <Settings className="w-5 h-5 transition-transform group-hover:rotate-45" />
            Settings
          </NavLink>
          <button
            onClick={() => {
              logout()
              setSidebarOpen(false)
            }}
            className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-6">
        {/* Header */}
        <header className="h-20 lg:h-24 flex items-center px-6 lg:px-10 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2.5 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/50 backdrop-blur hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors shadow-sm"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full glass-card text-sm text-gray-600 dark:text-gray-300 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Hello, {user?.username}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-10 pb-10">
          <div className="max-w-6xl mx-auto animation-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

