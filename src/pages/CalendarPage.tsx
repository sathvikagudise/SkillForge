import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CalendarWithNotes from "@/components/CalendarWithNotes";

const CalendarPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Schedule and track your study sessions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Study Schedule</CardTitle>
            <CardDescription>Plan your learning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarWithNotes />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
