import { useEffect, useState } from 'react'
import { Send, Upload, Phone, MessageSquare, Loader2, CheckCircle } from 'lucide-react'
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

export default function SendMessage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [mediaPath, setMediaPath] = useState('')
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    
    try {
      const response = await api.uploadFile(selectedFile)
      setMediaPath(response.data.path)
      toast.success('File uploaded')
    } catch (error: any) {
      toast.error(error.message || 'Upload failed')
      setFile(null)
    }
  }

  const sendMessage = async () => {
    if (!selectedAccount) {
      toast.error('Please select an account')
      return
    }
    if (!phone) {
      toast.error('Please enter a phone number')
      return
    }
    if (!message && !mediaPath) {
      toast.error('Please enter a message or attach a file')
      return
    }

    setSending(true)
    try {
      await api.sendMessage({
        accountId: selectedAccount,
        to: phone,
        message,
        type: file ? 'image' : 'text',
        mediaPath: mediaPath
      })
      
      toast.success('Message sent successfully')
      setSent(true)
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setPhone('')
        setMessage('')
        setFile(null)
        setMediaPath('')
        setSent(false)
      }, 2000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Send Message</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Send a single message to any Nezam WhatsApp number</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-green-600" />
            New Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Account Selection */}
          <div>
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
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              <Phone className="w-3.5 h-3.5 inline mr-1" />
              Phone Number
            </label>
            <Input
              placeholder="e.g., 2010xxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Enter with country code (e.g., 20 for Egypt)</p>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
              Message
            </label>
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Attachment (optional)</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Upload className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {file ? file.name : 'Choose file'}
                </span>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx,.mp3,.wav,.ogg"
                />
              </label>
              {file && (
                <button 
                  onClick={() => { setFile(null); setMediaPath('') }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Max 16MB. Images, PDF, DOC, Audio</p>
          </div>

          {/* Send Button */}
          <Button 
            onClick={sendMessage} 
            disabled={sending || sent}
            className="w-full bg-green-600 hover:bg-green-700 h-11"
          >
            {sent ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Sent Successfully
              </>
            ) : sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="pt-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Tips</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li>Use country code without + (e.g., 20 for Egypt)</li>
            <li>For media, images work best</li>
            <li>Make sure the account is connected before sending</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
