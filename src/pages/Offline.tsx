import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Offline = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Offline Mode</h1>
          <p className="text-muted-foreground">Access your content without internet</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Offline Settings</CardTitle>
            <CardDescription>Configure offline access to your materials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="offline-mode">Enable Offline Mode</Label>
              <Switch id="offline-mode" />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-sync">Auto-sync when online</Label>
              <Switch id="auto-sync" />
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Storage used: 0 MB / 500 MB available
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Offline;
