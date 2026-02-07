import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { meApi, updateProfileApi } from '@/lib/api';
import { User, Mail, Phone, MapPin, Calendar, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  profilePicture?: string;
  role: string;
  createdAt: number;
}

export default function UserProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await meApi();
      setUser(data);
      setFormData(data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : (name === 'age' ? parseInt(value) || undefined : value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfileApi({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        age: formData.age,
        gender: formData.gender,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        bio: formData.bio,
      });
      setUser(updated);
      toast({ title: 'Success', description: 'Profile updated successfully' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              User Profile
            </h1>
            <p className="text-muted-foreground">Manage your account details and personal information</p>
          </div>
        </div>

        <Card className="border-primary/20">
          <CardHeader className="border-b border-primary/10">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Account Information</CardTitle>
                <CardDescription>Your email and account role</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide">Email</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide">Role</Label>
                <Input value={user?.role || ''} disabled className="bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="border-b border-primary/10">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wide">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName || ''}
                    onChange={handleChange}
                    className="h-11 bg-background/60 border-primary/20 hover:border-primary/40 focus:border-primary/70 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wide">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName || ''}
                    onChange={handleChange}
                    className="h-11 bg-background/60 border-primary/20 hover:border-primary/40 focus:border-primary/70 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="h-11 bg-background/60 border-primary/20 hover:border-primary/40 focus:border-primary/70 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Age
                  </Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="30"
                    value={formData.age || ''}
                    onChange={handleChange}
                    className="h-11 bg-background/60 border-primary/20 hover:border-primary/40 focus:border-primary/70 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-xs font-semibold uppercase tracking-wide">
                  Gender
                </Label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
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
                <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Street Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="123 Main Street"
                  value={formData.address || ''}
                  onChange={handleChange}
                  className="h-11 bg-background/60 border-primary/20 hover:border-primary/40 focus:border-primary/70 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs font-semibold uppercase tracking-wide">
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="New York"
                    value={formData.city || ''}
                    onChange={handleChange}
                    className="h-11 bg-background/60 border-primary/20 hover:border-primary/40 focus:border-primary/70 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-xs font-semibold uppercase tracking-wide">
                    State
                  </Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="NY"
                    maxLength={2}
                    value={formData.state || ''}
                    onChange={handleChange}
                    className="h-11 bg-background/60 border-primary/20 hover:border-primary/40 focus:border-primary/70 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-xs font-semibold uppercase tracking-wide">
                    Zip Code
                  </Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    placeholder="10001"
                    value={formData.zipCode || ''}
                    onChange={handleChange}
                    className="h-11 bg-background/60 border-primary/20 hover:border-primary/40 focus:border-primary/70 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Bio
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  value={formData.bio || ''}
                  onChange={handleChange}
                  className="bg-background/60 border-primary/20 hover:border-primary/40 focus:border-primary/70 transition-all resize-none"
                />
              </div>
            </CardContent>

            <CardFooter className="border-t border-primary/10 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData(user || {});
                  toast({ description: 'Changes discarded' });
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
