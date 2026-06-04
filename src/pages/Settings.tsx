import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

const Settings = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailNotif, setEmailNotif] = useState(false);
  const [studyReminders, setStudyReminders] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from localStorage or use auth user
    const savedName = localStorage.getItem('user_profile_name') || user?.name || '';
    const savedEmail = localStorage.getItem('user_profile_email') || user?.email || '';
    const savedEmailNotif = localStorage.getItem('user_email_notifications') === 'true';
    const savedStudyReminders = localStorage.getItem('user_study_reminders') === 'true';

    setName(savedName);
    setEmail(savedEmail);
    setEmailNotif(savedEmailNotif);
    setStudyReminders(savedStudyReminders);
  }, [user]);

  const handleSave = () => {
    localStorage.setItem('user_profile_name', name);
    localStorage.setItem('user_profile_email', email);
    localStorage.setItem('user_email_notifications', String(emailNotif));
    localStorage.setItem('user_study_reminders', String(studyReminders));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    try { window.dispatchEvent(new Event('profileUpdated')); } catch {}
    try { window.dispatchEvent(new Event('dataChanged')); } catch {}
  };
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button onClick={handleSave}>{saved ? 'Saved!' : 'Save Changes'}</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notif">Email notifications</Label>
              <Switch id="email-notif" checked={emailNotif} onCheckedChange={(checked) => { setEmailNotif(checked); localStorage.setItem('user_email_notifications', String(checked)); }} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="study-reminders">Study reminders</Label>
              <Switch id="study-reminders" checked={studyReminders} onCheckedChange={(checked) => { setStudyReminders(checked); localStorage.setItem('user_study_reminders', String(checked)); }} />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
