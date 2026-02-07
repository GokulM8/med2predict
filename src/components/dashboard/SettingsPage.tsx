import { useEffect, useState } from 'react';
import { Bell, Calendar, Database, FileText, Loader2, MapPin, Phone, RefreshCw, Save, Shield, User } from 'lucide-react';
import { meApi, updateProfileApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface UserProfile {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  age?: number;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bio?: string;
  role: string;
}

export function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});
  const [settings, setSettings] = useState({
    emailAlerts: true,
    highRiskAlerts: true,
    weeklyReports: true,
    modelVersion: 'v2.4',
    confidenceThreshold: '0.65',
    autoRecalculate: true,
    dataRetention: '12',
    anonymizeExports: true,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await meApi();
      setUser(data);
      setProfileData(data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) || undefined : value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateProfileApi(profileData);
      setUser(updated);
      setProfileData(updated);
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (user) {
      setProfileData(user);
      toast({
        title: 'Settings reset',
        description: 'All settings have been restored to saved values.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your preferences and system configuration</p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            User Profile
          </CardTitle>
          <CardDescription>Your personal information and credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                value={profileData.firstName || ''}
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                value={profileData.lastName || ''}
                onChange={handleProfileChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={profileData.phone || ''}
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Age
              </Label>
              <Input
                id="age"
                name="age"
                type="number"
                min="1"
                max="120"
                placeholder="30"
                value={profileData.age || ''}
                onChange={handleProfileChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              name="gender"
              value={profileData.gender || ''}
              onChange={handleProfileChange}
              className="w-full h-11 px-3 py-2 rounded-lg border border-primary/20 bg-background/60 hover:border-primary/40 focus:border-primary/70 focus:ring-primary/20 transition-all"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Street Address
            </Label>
            <Input
              id="address"
              name="address"
              placeholder="123 Main Street"
              value={profileData.address || ''}
              onChange={handleProfileChange}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                placeholder="New York"
                value={profileData.city || ''}
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                placeholder="NY"
                maxLength={2}
                value={profileData.state || ''}
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                placeholder="10001"
                value={profileData.zipCode || ''}
                onChange={handleProfileChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Bio
            </Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Tell us about yourself..."
              rows={3}
              value={profileData.bio || ''}
              onChange={handleProfileChange}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive alerts and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Alerts</p>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={settings.emailAlerts}
              onCheckedChange={(checked) => setSettings({ ...settings, emailAlerts: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">High Risk Patient Alerts</p>
              <p className="text-sm text-muted-foreground">Immediate notification for high-risk assessments</p>
            </div>
            <Switch
              checked={settings.highRiskAlerts}
              onCheckedChange={(checked) => setSettings({ ...settings, highRiskAlerts: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Summary Reports</p>
              <p className="text-sm text-muted-foreground">Receive weekly analytics summary</p>
            </div>
            <Switch
              checked={settings.weeklyReports}
              onCheckedChange={(checked) => setSettings({ ...settings, weeklyReports: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Model Configuration
          </CardTitle>
          <CardDescription>Adjust the prediction model parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Model Version</Label>
              <Select value={settings.modelVersion} onValueChange={(v) => setSettings({ ...settings, modelVersion: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v2.4">v2.4 (XGBoost) - Latest</SelectItem>
                  <SelectItem value="v2.3">v2.3 (Random Forest)</SelectItem>
                  <SelectItem value="v2.2">v2.2 (Logistic Regression)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>High Risk Threshold</Label>
              <Select value={settings.confidenceThreshold} onValueChange={(v) => setSettings({ ...settings, confidenceThreshold: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.50">50% (Sensitive)</SelectItem>
                  <SelectItem value="0.65">65% (Balanced)</SelectItem>
                  <SelectItem value="0.80">80% (Specific)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-Recalculate on Input Change</p>
              <p className="text-sm text-muted-foreground">Automatically update predictions when data changes</p>
            </div>
            <Switch
              checked={settings.autoRecalculate}
              onCheckedChange={(checked) => setSettings({ ...settings, autoRecalculate: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Data Management
          </CardTitle>
          <CardDescription>Configure data storage and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Data Retention Period</Label>
            <Select value={settings.dataRetention} onValueChange={(v) => setSettings({ ...settings, dataRetention: v })}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
                <SelectItem value="24">24 Months</SelectItem>
                <SelectItem value="forever">Forever</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Anonymize Data Exports</p>
              <p className="text-sm text-muted-foreground">Remove personally identifiable information from exports</p>
            </div>
            <Switch
              checked={settings.anonymizeExports}
              onCheckedChange={(checked) => setSettings({ ...settings, anonymizeExports: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleReset} disabled={saving}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset to Saved
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
