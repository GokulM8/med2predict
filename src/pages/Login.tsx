import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { loginApi } from '@/lib/api';
import { setAuthToken } from '@/lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      setAuthToken(res.token);
      toast({ title: 'Signed in', description: `Welcome back, ${res.user.email}` });
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Check credentials and try again.';
      toast({ title: 'Login failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 overflow-hidden">
      {/* Decorative blur elements */}
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl opacity-40 animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-30 animate-float pointer-events-none"></div>

      <Card className="w-full max-w-md shadow-2xl border border-primary/20 relative z-10 bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-6 border-b border-primary/10">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-xl animate-heartbeat">
              <Activity className="w-7 h-7 text-white" strokeWidth={3} />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              SafePulse
            </h1>
            <CardDescription className="text-sm">Welcome back to your health dashboard</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/60 group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@safepulse.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-11 bg-background/60 border border-primary/20 hover:border-primary/40 focus:border-primary/70 focus:ring-primary/20 transition-all duration-200 rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/60 group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-11 bg-background/60 border border-primary/20 hover:border-primary/40 focus:border-primary/70 focus:ring-primary/20 transition-all duration-200 rounded-lg"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-5 border-t border-primary/10 pt-6">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group rounded-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary/15"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-card text-muted-foreground">New to SafePulse?</span>
              </div>
            </div>
            <Link
              to="/signup"
              className="w-full h-11 text-center flex items-center justify-center text-sm font-medium text-primary hover:bg-primary/8 border border-primary/25 rounded-lg transition-all duration-200 hover:border-primary/40"
            >
              Create an account
            </Link>
            <p className="text-xs text-muted-foreground text-center px-2">
              Demo credentials: <span className="font-mono text-primary">admin@safepulse.local</span>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
