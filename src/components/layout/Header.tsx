import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { clearAuthToken } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { Loader2, Moon, Sun, Users as UsersIcon } from 'lucide-react';
import { meApi } from '@/lib/api';

interface UserProfile {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadUser();
    initTheme();
  }, []);

  const loadUser = async () => {
    try {
      const data = await meApi();
      setUser(data);
      setIsAdmin(data.role === 'admin');
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
  };

  const initTheme = () => {
    const stored = localStorage.getItem('safepulse-theme') as 'light' | 'dark' | 'system' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored || (prefersDark ? 'dark' : 'light');
    applyTheme(initial);
    setTheme(initial);
  };

  const applyTheme = (value: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = value === 'dark' || (value === 'system' && prefersDark);
    root.classList.toggle('dark', isDark);
    localStorage.setItem('safepulse-theme', value);
  };

  const toggleTheme = () => {
    const current = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    const next = current === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  };

  const resetThemeToSystem = () => {
    setTheme('system');
    applyTheme('system');
  };

  const getDisplayName = () => {
    if (!user) return 'User';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    return user.email.split('@')[0];
  };

  const getInitials = () => {
    if (!user) return 'U';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    return user.email[0].toUpperCase();
  };

  const getRoleDisplay = () => {
    if (!user) return '';
    return user.role === 'admin' ? 'Administrator' : 'Medical Professional';
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">Intelligent Heart Risk Dashboard</h1>
        <p className="text-sm text-muted-foreground">Clinical decision support for cardiovascular risk</p>
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          onClick={toggleTheme}
        >
          {(theme === 'light' || (theme === 'system' && !document.documentElement.classList.contains('dark')))
            ? <Moon className="w-5 h-5" />
            : <Sun className="w-5 h-5" />}
        </Button>
        {isAdmin && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/users')}
            title="Manage Users"
          >
            <UsersIcon className="w-4 h-4 mr-2" /> Users
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={resetThemeToSystem}
        >
          System
        </Button>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-right">
              <p className="text-sm font-medium">{getDisplayName()}</p>
              <p className="text-xs text-muted-foreground">{getRoleDisplay()}</p>
            </div>
            <Avatar className="h-10 w-10 bg-primary cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/profile')}>
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{getInitials()}</AvatarFallback>
            </Avatar>
          </>
        )}
      </div>
    </header>
  );
}
