import { useEffect, useState } from 'react'
import { Bot, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, MessageSquare, Reply } from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface AutomationRule {
  _id: string
  keyword: string
  reply: string
  isActive: boolean
  matchType: string
  createdAt: string
}

export default function Automation() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [reply, setReply] = useState('')
  const [matchType, setMatchType] = useState('contains')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      const response = await api.getRules()
      setRules(response.data || [])
    } catch (error) {
      console.error('Failed to load rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const createRule = async () => {
    if (!keyword.trim() || !reply.trim()) {
      toast.error('Keyword and reply are required')
      return
    }

    setCreating(true)
    try {
      await api.createRule({ keyword, reply, matchType })
      toast.success('Rule created successfully')
      setKeyword('')
      setReply('')
      setMatchType('contains')
      setDialogOpen(false)
      loadRules()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create rule')
    } finally {
      setCreating(false)
    }
  }

  const toggleRule = async (id: string) => {
    try {
      await api.toggleRule(id)
      toast.success('Rule status updated')
      loadRules()
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle rule')
    }
  }

  const deleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      await api.deleteRule(id)
      toast.success('Rule deleted')
      loadRules()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete rule')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reply Automation</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Set up auto-reply rules for incoming messages</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Auto-Reply Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                  Keyword
                </label>
                <Input
                  placeholder="e.g., price, hi, help"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">The word that triggers the auto-reply</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Match Type</label>
                <Select value={matchType} onValueChange={setMatchType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains (anywhere in message)</SelectItem>
                    <SelectItem value="exact">Exact match only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  <Reply className="w-3.5 h-3.5 inline mr-1" />
                  Reply Message
                </label>
                <Textarea
                  placeholder="Type the auto-reply message..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={createRule} 
                disabled={creating}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No automation rules</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Add your first auto-reply rule</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <Card key={rule._id} className={`border-0 shadow-sm ${!rule.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className={`w-5 h-5 ${rule.isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                    <div>
                      <CardTitle className="text-base">{rule.keyword}</CardTitle>
                      <p className="text-xs text-gray-500">{rule.matchType} match</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRule(rule._id)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {rule.isActive ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  {rule.reply}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">
                    Created: {new Date(rule.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRule(rule._id)}
                    className="text-red-600 hover:text-red-700 h-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-0 shadow-sm bg-purple-50 dark:bg-purple-900/20">
        <CardContent className="pt-4">
          <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">How it works</h4>
          <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-1 list-disc list-inside">
            <li>Rules are checked when a new message is received</li>
            <li>Only the first matching rule will be triggered</li>
            <li>Case insensitive matching</li>
            <li>&quot;Contains&quot; matches if the keyword appears anywhere in the message</li>
            <li>&quot;Exact&quot; only matches if the entire message equals the keyword</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
