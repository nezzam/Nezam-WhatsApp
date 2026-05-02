import { useEffect, useState } from 'react'
import { ClipboardList, RefreshCw, CheckCircle, XCircle, Clock, Loader2, Filter } from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface Message {
  _id: string
  accountId: {
    name: string
    phone: string
  }
  to: string
  type: string
  message: string
  status: string
  errorMessage: string
  createdAt: string
  sentAt: string
}

interface QueueJob {
  _id: string
  accountId: {
    name: string
  }
  to: string
  message: string
  status: string
  errorMessage: string
  createdAt: string
  scheduledAt: string
  processedAt: string
}

export default function Logs() {
  const [messages, setMessages] = useState<Message[]>([])
  const [queueJobs, setQueueJobs] = useState<QueueJob[]>([])
  const [activeTab, setActiveTab] = useState<'messages' | 'queue'>('messages')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [queueStats, setQueueStats] = useState({ pending: 0, processing: 0, completed: 0, failed: 0 })

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setInitialLoading(false));
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [statusFilter])

  const loadData = async () => {
    try {
      const params = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}
      
      const [msgResponse, queueResponse, statsResponse] = await Promise.all([
        api.getMessages({ limit: 50, ...params }),
        api.getQueueJobs(params),
        api.getQueueStats()
      ])

      setMessages(msgResponse?.data || [])
      setQueueJobs(queueResponse?.data || [])
      setQueueStats(statsResponse?.data || { pending: 0, processing: 0, completed: 0, failed: 0 })
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'COMPLETED':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
          <CheckCircle className="w-3.5 h-3.5 mr-1" />{status}
        </Badge>
      case 'FAILED':
        return <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border-rose-500/20">
          <XCircle className="w-3.5 h-3.5 mr-1" />{status}
        </Badge>
      case 'PENDING':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20">
          <Clock className="w-3.5 h-3.5 mr-1" />{status}
        </Badge>
      case 'PROCESSING':
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/20">
          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />{status}
        </Badge>
      default:
        return <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 hover:bg-gray-500/20 border-gray-500/20">{status}</Badge>
    }
  }

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin relative" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading logs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Logs & Activity</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Monitor your message history and active queue status in real-time.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="glass-card w-full sm:w-auto hover:bg-white/50 dark:hover:bg-gray-800/50">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        <Card className="glass-card relative overflow-hidden group">
          <div className="absolute inset-0 bg-amber-500/5 transition-colors group-hover:bg-amber-500/10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 mb-2">
              <Clock className="w-5 h-5" />
              <p className="text-sm font-semibold">Pending</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{queueStats.pending}</p>
          </CardContent>
        </Card>
        <Card className="glass-card relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 transition-colors group-hover:bg-blue-500/10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-500 mb-2">
              <Loader2 className="w-5 h-5" />
              <p className="text-sm font-semibold">Processing</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{queueStats.processing}</p>
          </CardContent>
        </Card>
        <Card className="glass-card relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 transition-colors group-hover:bg-emerald-500/10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-500 mb-2">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm font-semibold">Completed</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{queueStats.completed}</p>
          </CardContent>
        </Card>
        <Card className="glass-card relative overflow-hidden group">
          <div className="absolute inset-0 bg-rose-500/5 transition-colors group-hover:bg-rose-500/10"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-500 mb-2">
              <XCircle className="w-5 h-5" />
              <p className="text-sm font-semibold">Failed</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{queueStats.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'messages' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('messages')}
          >
            <ClipboardList className="w-4 h-4 mr-1" />
            Messages ({messages.length})
          </Button>
          <Button
            variant={activeTab === 'queue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('queue')}
          >
            <Clock className="w-4 h-4 mr-1" />
            Queue ({queueJobs.length})
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages Table */}
      {activeTab === 'messages' ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">To</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Message</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No messages found
                      </td>
                    </tr>
                  ) : (
                    messages.map((msg) => (
                      <tr key={msg._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{msg.to}</p>
                            {msg.accountId && (
                              <p className="text-xs text-gray-500">{msg.accountId.name}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="truncate">{msg.message}</p>
                          {msg.errorMessage && (
                            <p className="text-xs text-red-600 mt-1">{msg.errorMessage}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(msg.status)}</td>
                        <td className="py-3 px-4 text-gray-500">
                          {msg.sentAt 
                            ? new Date(msg.sentAt).toLocaleString() 
                            : new Date(msg.createdAt).toLocaleString()
                          }
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Queue Table */
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">To</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Message</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Scheduled</th>
                  </tr>
                </thead>
                <tbody>
                  {queueJobs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No queue jobs found
                      </td>
                    </tr>
                  ) : (
                    queueJobs.map((job) => (
                      <tr key={job._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <p className="font-medium">{job.to}</p>
                          {job.accountId && (
                            <p className="text-xs text-gray-500">{job.accountId.name}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="truncate">{job.message}</p>
                          {job.errorMessage && (
                            <p className="text-xs text-red-600 mt-1">{job.errorMessage}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(job.status)}</td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(job.scheduledAt || job.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
