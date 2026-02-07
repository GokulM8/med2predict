import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, User as UserIcon, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listUsersApi, meApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UserRow {
  id: number;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  createdAt: number;
  updatedAt?: number;
}

export default function UsersPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await meApi();
        const admin = me.role === 'admin';
        setIsAdmin(admin);
        if (!admin) return;
        const data = await listUsersApi();
        setUsers(data);
      } catch (err: unknown) {
        const msg = (err as Record<string, unknown>)?.message || 'Failed to load users';
        setErrorMsg(msg as string);
        toast({ title: 'Failed to load users', description: msg as string, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const data = await listUsersApi();
      setUsers(data);
      toast({ title: 'Users refreshed' });
    } catch (err: unknown) {
      const msg = (err as Record<string, unknown>)?.message || 'Refresh failed';
      setErrorMsg(msg as string);
      toast({ title: 'Refresh failed', description: msg as string, variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-muted-foreground">Loading users…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>Only administrators can view users.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Your account does not have the required permissions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary" /> Users
          </h2>
          <p className="text-muted-foreground">Registered users and roles</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Directory
          </CardTitle>
          <CardDescription>Overview of all registered users</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <p className="text-sm text-destructive mb-3">{errorMsg}</p>
          )}
          {users.length === 0 && !errorMsg ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="py-2 pr-4">{u.id}</td>
                      <td className="py-2 pr-4 font-mono">{u.email}</td>
                      <td className="py-2 pr-4">{u.role}</td>
                      <td className="py-2 pr-4">{(u.firstName || '') + (u.lastName ? ' ' + u.lastName : '')}</td>
                      <td className="py-2 pr-4">{new Date(u.createdAt).toLocaleString()}</td>
                      <td className="py-2">{u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
