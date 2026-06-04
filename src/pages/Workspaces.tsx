import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send, Trash } from "lucide-react";
import { apiCall } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

type Task = { id: string; text: string; completed: boolean };
type Workspace = { id: string; name: string; tasks: Task[] };

const STORAGE_KEY = "workspaces";

const genId = () => Math.random().toString(36).slice(2, 9);

const loadWorkspaces = (): Workspace[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.warn("Failed to load workspaces", e);
  }
  return [];
};

const saveWorkspaces = (workspaces: Workspace[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  } catch (e) {
    console.warn("Failed to save workspaces", e);
  }
};

const Workspaces = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => loadWorkspaces());
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  useEffect(() => {
    saveWorkspaces(workspaces);
  }, [workspaces]);

  const addWorkspace = () => {
    if (!newWorkspaceName.trim()) return;
    const w: Workspace = { id: genId(), name: newWorkspaceName.trim(), tasks: [] };
    setWorkspaces((s) => [w, ...s]);
    setNewWorkspaceName("");
    toast({ title: "Workspace created", description: w.name });
  };

  const removeWorkspace = (id: string) => {
    setWorkspaces((s) => s.filter((w) => w.id !== id));
  };

  const addTask = (workspaceId: string, text: string) => {
    if (!text.trim()) return;
    setWorkspaces((s) =>
      s.map((w) => (w.id === workspaceId ? { ...w, tasks: [{ id: genId(), text: text.trim(), completed: false }, ...w.tasks] } : w)),
    );
  };

  const removeTask = (workspaceId: string, taskId: string) => {
    setWorkspaces((s) => s.map((w) => (w.id === workspaceId ? { ...w, tasks: w.tasks.filter((t) => t.id !== taskId) } : w)));
  };

  const toggleTask = (workspaceId: string, taskId: string) => {
    setWorkspaces((s) =>
      s.map((w) =>
        w.id === workspaceId
          ? { ...w, tasks: w.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)) }
          : w,
      ),
    );
  };

  const pendingTasks = useMemo(() => {
    return workspaces.flatMap((w) => w.tasks.filter((t) => !t.completed).map((t) => ({ ...t, workspace: w.name, workspace_id: w.id })));
  }, [workspaces]);

  const sendReminder = async () => {
    const emailFromStorage = localStorage.getItem("user_profile_email");
    const email = emailFromStorage || user?.email;
    const user_id = user?.user_id ?? localStorage.getItem("user_id");

    if (!email) {
      toast({ title: "No email", description: "Please set your email in profile or localStorage key 'user_profile_email'" });
      return;
    }

    if (pendingTasks.length === 0) {
      toast({ title: "No pending tasks", description: "There are no pending tasks to email." });
      return;
    }

    const tasksForApi = pendingTasks.map((t) => ({ id: t.id, text: t.text, workspace: (t as any).workspace, workspace_id: (t as any).workspace_id }));

    try {
      await apiCall("/email/send-task-reminder", {
        method: "POST",
        body: JSON.stringify({ email, tasks: tasksForApi, user_id }),
      });
      toast({ title: "Reminder sent", description: `Sent ${tasksForApi.length} tasks to ${email}` });
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Send failed", description: message });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Workspaces</h1>
            <p className="text-muted-foreground">Organize content by subject or project</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={sendReminder}>
              <Send className="w-4 h-4 mr-2" />
              Send Email Reminder
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Workspaces</CardTitle>
            <CardDescription>Manage different learning areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <Input placeholder="New workspace name" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} />
              <Button onClick={addWorkspace}>
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>

            {workspaces.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No workspaces yet. Create one to organize your content!</p>
            ) : (
              <div className="space-y-4">
                {workspaces.map((w) => (
                  <div key={w.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold">{w.name}</div>
                      <div className="text-sm text-muted-foreground">{w.tasks.filter((t) => !t.completed).length} pending</div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <WorkspaceTasks
                        workspace={w}
                        onAdd={(text) => addTask(w.id, text)}
                        onToggle={(taskId) => toggleTask(w.id, taskId)}
                        onRemove={(taskId) => removeTask(w.id, taskId)}
                      />
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button variant="destructive" onClick={() => removeWorkspace(w.id)}>
                        <Trash className="w-4 h-4 mr-2" />
                        Delete Workspace
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const WorkspaceTasks: React.FC<{
  workspace: Workspace;
  onAdd: (text: string) => void;
  onToggle: (taskId: string) => void;
  onRemove: (taskId: string) => void;
}> = ({ workspace, onAdd, onToggle, onRemove }) => {
  const [text, setText] = useState("");

  return (
    <div>
      <div className="flex gap-2">
        <Input placeholder="Add task" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => {
          if (e.key === 'Enter') { onAdd(text); setText(''); }
        }} />
        <Button onClick={() => { onAdd(text); setText(''); }}>
          Add
        </Button>
      </div>

      <ul className="mt-3 space-y-2">
        {workspace.tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={t.completed} onChange={() => onToggle(t.id)} />
              <span className={t.completed ? "line-through text-muted-foreground" : ""}>{t.text}</span>
            </label>
            <Button variant="ghost" onClick={() => onRemove(t.id)}>Remove</Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Workspaces;
