import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function Setup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.checkSetupStatus();
        if (!res.isSetupRequired) {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Failed to check setup status', error);
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, [navigate]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Please enter username and password');
    
    setLoading(true);
    try {
      const res = await api.setupAdmin({ username, password });
      if (res.success) {
        toast.success('Admin account created successfully!');
        login(res.token, res.user);
        navigate('/', { replace: true });
      } else {
        toast.error(res.error || 'Failed to setup admin account');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center">Checking system status...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome to Nezam WhatsApp</CardTitle>
          <CardDescription>
            It looks like this is your first time here. Let's create an admin account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSetup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Complete Setup'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
