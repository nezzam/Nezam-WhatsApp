import { useEffect, useState } from 'react'
import { Send, Upload, Loader2, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Account {
  _id: string
  name: string
  phone: string
  status: string
}

interface BulkMessage {
  to: string
  message: string
  type?: string
}

export default function BulkSend() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [messages, setMessages] = useState<BulkMessage[]>([{ to: '', message: '' }])
  const [csvText, setCsvText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const response = await api.getAccounts()
      const connected = (response.data || []).filter((a: Account) => a.status === 'CONNECTED')
      setAccounts(connected)
    } catch (error) {
      console.error('Failed to load accounts:', error)
    }
  }

  const addRow = () => {
    setMessages([...messages, { to: '', message: '' }])
  }

  const removeRow = (index: number) => {
    if (messages.length === 1) return
    setMessages(messages.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: 'to' | 'message', value: string) => {
    const updated = [...messages]
    updated[index][field] = value
    setMessages(updated)
  }

  const handleCsvImport = () => {
    if (!csvText.trim()) {
      toast.error('Please paste CSV data')
      return
    }

    const lines = csvText.trim().split('\n')
    const newMessages: BulkMessage[] = []

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim())
      if (parts.length >= 2 && parts[0] && parts[1]) {
        newMessages.push({ to: parts[0], message: parts[1] })
      }
    }

    if (newMessages.length === 0) {
      toast.error('No valid data found. Format: phone,message')
      return
    }

    setMessages([...messages, ...newMessages])
    setCsvText('')
    toast.success(`${newMessages.length} rows imported`)
  }

  const sendBulk = async () => {
    if (!selectedAccount) {
      toast.error('Please select an account')
      return
    }

    const validMessages = messages.filter(m => m.to && m.message)
    if (validMessages.length === 0) {
      toast.error('Please add at least one valid message')
      return
    }

    setSending(true)
    try {
      await api.bulkSend(selectedAccount, validMessages)
      toast.success(`${validMessages.length} messages queued successfully`)
      setSent(true)
      
      setTimeout(() => {
        setMessages([{ to: '', message: '' }])
        setSent(false)
      }, 3000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to queue messages')
    } finally {
      setSending(false)
    }
  }

  const loadSampleData = () => {
    setMessages([
      { to: '201001234567', message: 'Hello! This is a test message 1' },
      { to: '201001234568', message: 'Hello! This is a test message 2' },
      { to: '201001234569', message: 'Hello! This is a test message 3' },
    ])
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Send</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Send messages to multiple recipients with smart delays</p>
      </div>

      {/* Account Selection */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4">
          <label className="text-sm font-medium mb-1.5 block">Nezam WhatsApp Account</label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.length === 0 ? (
                <SelectItem value="none" disabled>No connected accounts</SelectItem>
              ) : (
                accounts.map((account) => (
                  <SelectItem key={account._id} value={account._id}>
                    {account.name} {account.phone && `(${account.phone})`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* CSV Import */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import from CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Paste CSV data: phone,message (one per line)&#10;201001234567,Hello there!&#10;201001234568,How are you?"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCsvImport}>
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
            <Button variant="ghost" size="sm" onClick={loadSampleData}>
              Load Sample
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Recipients ({messages.length})</span>
            <span className="text-xs text-gray-500 font-normal">
              {messages.filter(m => m.to && m.message).length} valid
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Phone number"
                    value={msg.to}
                    onChange={(e) => updateRow(index, 'to', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="flex-[2]">
                  <Input
                    placeholder="Message"
                    value={msg.message}
                    onChange={(e) => updateRow(index, 'message', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(index)}
                  disabled={messages.length === 1}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addRow} className="mt-3 w-full">
            <Plus className="w-4 h-4 mr-1" />
            Add Row
          </Button>
        </CardContent>
      </Card>

      {/* Send Button */}
      <Button 
        onClick={sendBulk} 
        disabled={sending || sent}
        className="w-full bg-green-600 hover:bg-green-700 h-11"
      >
        {sent ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Queued Successfully
          </>
        ) : sending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Queuing Messages...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send {messages.filter(m => m.to && m.message).length} Messages
          </>
        )}
      </Button>

      {/* Info */}
      <Card className="border-0 shadow-sm bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="pt-4">
          <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Bulk Send Info
          </h4>
          <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1 list-disc list-inside">
            <li>Random delay between 5-20 seconds per message</li>
            <li>Extra 60-120 seconds delay after every 10 messages</li>
            <li>Maximum 1000 messages per batch</li>
            <li>Messages are queued and processed in background</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
