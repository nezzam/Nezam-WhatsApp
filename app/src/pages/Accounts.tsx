import { useEffect, useState } from 'react'
import { 
  Smartphone, 
  Plus, 
  QrCode, 
  RefreshCw, 
  Power, 
  Trash2, 
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { api } from '@/services/api'
import QRCode from 'qrcode'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Account {
  _id: string
  name: string
  phone: string
  status: string
  qrCode: string
  createdAt: string
  realtimeStatus?: string
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [newAccountName, setNewAccountName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadAccounts()
    const interval = setInterval(loadAccounts, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadAccounts = async () => {
    try {
      const response = await api.getAccounts()
      setAccounts(response.data || [])
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAccount = async () => {
    if (!newAccountName.trim()) {
      toast.error('Please enter an account name')
      return
    }

    setCreateLoading(true)
    try {
      await api.createAccount(newAccountName)
      toast.success('Account created successfully')
      setNewAccountName('')
      loadAccounts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setCreateLoading(false)
    }
  }

  const disconnectAccount = async (id: string) => {
    setActionLoading(id)
    try {
      await api.disconnectAccount(id)
      toast.success('Account disconnected')
      loadAccounts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect')
    } finally {
      setActionLoading(null)
    }
  }

  const restartAccount = async (id: string) => {
    setActionLoading(id)
    try {
      await api.restartAccount(id)
      toast.success('Account restarted')
      loadAccounts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to restart')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    setActionLoading(id)
    try {
      await api.deleteAccount(id)
      toast.success('Account deleted')
      loadAccounts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete')
    } finally {
      setActionLoading(null)
    }
  }

  const showQR = (account: Account) => {
    // fetch QR payload from backend then open dialog
    setSelectedAccount(null)
    setQrDataUrl(null)
    setQrDialogOpen(true)

    ;(async () => {
      try {
        const resp = await api.getQRCode(account._id)
        const qr = resp?.data?.qrCode
        setSelectedAccount({ ...account, qrCode: qr })
      } catch (err: any) {
        console.error('Failed to fetch QR:', err)
        toast.error(err?.message || 'Failed to fetch QR')
        setQrDialogOpen(false)
      }
    })()
  }

  useEffect(() => {
    let mounted = true
    const buildQr = async () => {
      setQrDataUrl(null)
      const value = selectedAccount?.qrCode
      if (!value) return
      try {
        // selectedAccount.qrCode contains the raw QR payload from whatsapp-web.js
        // use reasonable size + error correction to make it scannable
        const url = await QRCode.toDataURL(value, { margin: 1, width: 480, errorCorrectionLevel: 'M' })
        if (mounted) {
          console.log('Generated QR DataURL length:', url?.length)
          setQrDataUrl(url)
        }
      } catch (err) {
        console.error('Failed to render QR:', err)
      }
    }

    if (qrDialogOpen) buildQr()
    return () => { mounted = false }
  }, [selectedAccount, qrDialogOpen])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'QR_READY':
        return <QrCode className="w-4 h-4 text-orange-500" />
      case 'INITIALIZING':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'SCANNED':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'QR_READY':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'INITIALIZING':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'SCANNED':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nezam WhatsApp Accounts</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your connected Nezam WhatsApp accounts</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Account Name</label>
                <Input
                  placeholder="e.g., Main Business Account"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createAccount()}
                />
              </div>
              <Button 
                onClick={createAccount} 
                disabled={createLoading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {createLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No accounts connected</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Add your first Nezam WhatsApp account to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account._id} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{account.name}</CardTitle>
                      <p className="text-xs text-gray-500">{account.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.realtimeStatus || account.status)}`}>
                    {getStatusIcon(account.realtimeStatus || account.status)}
                    {account.realtimeStatus || account.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span>Created: {new Date(account.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex gap-2">
                  {(account.realtimeStatus === 'QR_READY' || account.status === 'QR_READY') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => showQR(account)}
                      className="flex-1"
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      Show QR
                    </Button>
                  )}
                  {(account.realtimeStatus === 'CONNECTED' || account.status === 'CONNECTED') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => disconnectAccount(account._id)}
                      disabled={actionLoading === account._id}
                      className="flex-1"
                    >
                      <Power className="w-4 h-4 mr-1" />
                      Disconnect
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => restartAccount(account._id)}
                    disabled={actionLoading === account._id}
                  >
                    <RefreshCw className={`w-4 h-4 ${actionLoading === account._id ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteAccount(account._id)}
                    disabled={actionLoading === account._id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {selectedAccount?.qrCode ? (
              <>
                <div className="bg-white p-4 rounded-lg mb-4">
                  <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="WhatsApp QR" className="w-48 h-48" />
                    ) : (
                      // while the QR image is being generated, show a placeholder icon
                      <QrCode className="w-32 h-32 text-gray-800" />
                    )}
                  </div>
                </div>
                {/* raw QR payload for debugging (hidden by default in prod) */}
                <pre className="text-xs text-gray-400 mt-2 break-words max-w-full">{selectedAccount?.qrCode}</pre>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Open WhatsApp on your phone and scan this QR code
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Settings &gt; Linked Devices &gt; Link a Device
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-500">Generating QR code...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
