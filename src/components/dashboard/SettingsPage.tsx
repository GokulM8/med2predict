import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings, User, Bell, Shield, Database, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    // User Profile
    doctorName: 'Dr. Sarah Chen',
    department: 'Cardiology Dept.',
    email: 'sarah.chen@hospital.org',
    
    // Notifications
    emailAlerts: true,
    highRiskAlerts: true,
    weeklyReports: true,
    
    // Model Settings
    modelVersion: 'v2.4',
    confidenceThreshold: '0.65',
    autoRecalculate: true,
    
    // Data Settings
    dataRetention: '12',
    anonymizeExports: true,
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleReset = () => {
    toast({
      title: "Settings reset",
      description: "All settings have been restored to defaults.",
    });
  };

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
              <Label htmlFor="doctorName">Full Name</Label>
              <Input
                id="doctorName"
                value={settings.doctorName}
                onChange={(e) => setSettings({ ...settings, doctorName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={settings.department}
                onChange={(e) => setSettings({ ...settings, department: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
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
        <Button variant="outline" onClick={handleReset}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
