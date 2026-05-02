import { useEffect, useState } from 'react'
import { 
  Smartphone, 
  Send, 
  Clock, 
  Bot, 
  TrendingUp,
  Activity
} from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardStats {
  accounts: {
    total: number
    connected: number
  }
  messages: {
    total: number
  }
  queue: {
    pending: number
    processing: number
    completed: number
    failed: number
  }
  automation: {
    totalRules: number
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      const response = await api.getDashboardStats()
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      title: 'Total Accounts',
      value: stats?.accounts.total || 0,
      sub: `${stats?.accounts.connected || 0} Connected`,
      icon: Smartphone,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Messages Sent',
      value: stats?.messages.total || 0,
      sub: 'Total messages',
      icon: Send,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Queue Status',
      value: stats?.queue.pending || 0,
      sub: `${stats?.queue.processing || 0} Processing`,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: 'Automation Rules',
      value: stats?.automation.totalRules || 0,
      sub: 'Active rules',
      icon: Bot,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your Nezam WhatsApp system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {card.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-green-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <a 
                href="/accounts" 
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Smartphone className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">Add Account</p>
                  <p className="text-xs text-gray-500">Connect WhatsApp</p>
                </div>
              </a>
              <a 
                href="/send" 
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Send className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">Send Message</p>
                  <p className="text-xs text-gray-500">Single message</p>
                </div>
              </a>
              <a 
                href="/bulk" 
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-sm">Bulk Send</p>
                  <p className="text-xs text-gray-500">Multiple recipients</p>
                </div>
              </a>
              <a 
                href="/automation" 
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Bot className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-sm">Automation</p>
                  <p className="text-xs text-gray-500">Auto-reply rules</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-orange-600" />
              Queue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                <span className="text-sm font-semibold text-orange-600">{stats?.queue.pending || 0}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(((stats?.queue.pending || 0) / 100) * 100, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Processing</span>
                <span className="text-sm font-semibold text-blue-600">{stats?.queue.processing || 0}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(((stats?.queue.processing || 0) / 50) * 100, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                <span className="text-sm font-semibold text-green-600">{stats?.queue.completed || 0}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(((stats?.queue.completed || 0) / 500) * 100, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Failed</span>
                <span className="text-sm font-semibold text-red-600">{stats?.queue.failed || 0}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(((stats?.queue.failed || 0) / 50) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
