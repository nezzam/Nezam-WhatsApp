import React, { useState, useEffect } from 'react'
import { Shield, Clock, Database, Info, Key, Lock, Smartphone as SmartphoneIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Settings() {
  const { user, updateUser } = useAuth()
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)

  // 2FA state
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [loading2FA, setLoading2FA] = useState(false)

  // API Key state
  const [apiKey, setApiKey] = useState(user?.apiKey || '')
  const [loadingApiKey, setLoadingApiKey] = useState(false)

  useEffect(() => {
    if (user?.apiKey) {
      setApiKey(user.apiKey)
    } else {
      setApiKey('')
    }
  }, [user])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) return toast.error('Fill in all fields')
    
    setLoadingPassword(true)
    try {
      const res = await api.updatePassword({ currentPassword, newPassword })
      if (res.success) {
        toast.success('Password updated successfully')
        setCurrentPassword('')
        setNewPassword('')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update password')
    } finally {
      setLoadingPassword(false)
    }
  }

  const handleGenerate2FA = async () => {
    setLoading2FA(true)
    try {
      const res = await api.generate2fa()
      if (res.success) {
        setQrCode(res.qrCode)
        setTwoFactorSecret(res.secret)
      }
    } catch (error: any) {
      toast.error('Failed to generate 2FA setup')
    } finally {
      setLoading2FA(false)
    }
  }

  const handleEnable2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) return toast.error('Enter a valid 6-digit code')
    
    setLoading2FA(true)
    try {
      const res = await api.enable2fa({ secret: twoFactorSecret, token: twoFactorCode })
      if (res.success) {
        toast.success('2FA Enabled successfully')
        updateUser({ ...user!, isTwoFactorEnabled: true })
        setQrCode(null)
        setTwoFactorSecret(null)
        setTwoFactorCode('')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to enable 2FA')
    } finally {
      setLoading2FA(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) return toast.error('Enter a valid 6-digit code')
    
    setLoading2FA(true)
    try {
      const res = await api.disable2fa({ token: twoFactorCode })
      if (res.success) {
        toast.success('2FA Disabled successfully')
        updateUser({ ...user!, isTwoFactorEnabled: false })
        setTwoFactorCode('')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to disable 2FA')
    } finally {
      setLoading2FA(false)
    }
  }

  const handleGenerateApiKey = async () => {
    setLoadingApiKey(true)
    try {
      const res = await api.generateApiKey()
      if (res.success) {
        toast.success('API Key generated successfully')
        setApiKey(res.apiKey)
        updateUser({ ...user!, apiKey: res.apiKey })
      }
    } catch (error: any) {
      toast.error('Failed to generate API Key')
    } finally {
      setLoadingApiKey(false)
    }
  }

  const handleRevokeApiKey = async () => {
    setLoadingApiKey(true)
    try {
      const res = await api.revokeApiKey()
      if (res.success) {
        toast.success('API Key revoked successfully')
        setApiKey('')
        updateUser({ ...user!, apiKey: null })
      }
    } catch (error: any) {
      toast.error('Failed to revoke API Key')
    } finally {
      setLoadingApiKey(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage system configuration and security</p>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api">API Config</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4 mt-4">
          {/* Password Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="w-5 h-5 text-indigo-600" />
                Change Password
              </CardTitle>
              <CardDescription>Update your admin account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input 
                    type="password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                  />
                </div>
                <Button type="submit" disabled={loadingPassword}>
                  {loadingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SmartphoneIcon className="w-5 h-5 text-green-600" />
                Two-Factor Authentication (2FA)
              </CardTitle>
              <CardDescription>
                {user?.isTwoFactorEnabled 
                  ? '2FA is currently enabled. You can disable it below.' 
                  : 'Add an extra layer of security to your account.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user?.isTwoFactorEnabled ? (
                <>
                  {!qrCode ? (
                    <Button onClick={handleGenerate2FA} disabled={loading2FA} variant="outline">
                      {loading2FA ? 'Setting up...' : 'Setup 2FA'}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg inline-block shadow-sm" data-secret={twoFactorSecret}>
                        <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                      </div>
                      <p className="text-sm text-gray-500">
                        Scan this QR code with Google Authenticator or Authy, then enter the 6-digit code below to confirm.
                      </p>
                      <div className="flex gap-2 max-w-xs">
                        <Input 
                          placeholder="000000" 
                          maxLength={6}
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value)}
                        />
                        <Button onClick={handleEnable2FA} disabled={loading2FA}>Verify</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4 max-w-xs">
                  <p className="text-sm text-gray-500">Enter your 6-digit code to disable 2FA.</p>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="000000" 
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                    />
                    <Button variant="destructive" onClick={handleDisable2FA} disabled={loading2FA}>Disable</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Key Management */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="w-5 h-5 text-amber-600" />
                API Key Management (Nezam WhatsApp Gateway)
              </CardTitle>
              <CardDescription>
                Use this API key to authenticate external requests to this system. Keep it secret.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKey ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between border border-border">
                    <code className="text-sm break-all font-mono">
                      {apiKey.substring(0, 8)}...{apiKey.substring(apiKey.length - 8)}
                    </code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiKey)}>
                      Copy Full Key
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleGenerateApiKey} disabled={loadingApiKey} variant="outline">
                      Regenerate Key
                    </Button>
                    <Button onClick={handleRevokeApiKey} disabled={loadingApiKey} variant="destructive">
                      Revoke Key
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-4">No API key is currently active.</p>
                  <Button onClick={handleGenerateApiKey} disabled={loadingApiKey}>
                    Generate New API Key
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-green-600" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">API Base URL</span>
                <Badge variant="outline">http://localhost:5000/api</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Authentication</span>
                <Badge variant="outline">X-API-Key Header or Bearer Token</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rate Limit</span>
                <Badge variant="outline">1000 req / 15 min</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-orange-600" />
                Queue Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Delay Between Messages</span>
                <Badge variant="outline">5 - 20 seconds</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bulk Cooldown (after 10 msgs)</span>
                <Badge variant="outline">60 - 120 seconds</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Max Bulk Batch Size</span>
                <Badge variant="outline">1000 messages</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5 text-blue-600" />
                Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                <Badge variant="outline">MongoDB</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">File Storage</span>
                <Badge variant="outline">Local (/uploads)</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Max File Size</span>
                <Badge variant="outline">16 MB</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gray-50 dark:bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="w-5 h-5 text-gray-600" />
                About
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nezam WhatsApp System v2.0.0
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Built with Node.js, Express, MongoDB, and whatsapp-web.js
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
