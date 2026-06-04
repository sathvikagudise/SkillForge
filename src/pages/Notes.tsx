import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { notesAPI } from "@/services/api";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Notes = () => {
  const [notes, setNotes] = useState<Array<any>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    try {
      const token = localStorage.getItem('access_token') || undefined;
      console.debug('Notes.load token:', token ? (token.length > 12 ? token.slice(0,8) + '...' + token.slice(-8) : token) : null);
      const data = await notesAPI.list(token);
      // Debugging: log raw response so we can see what backend returned
      console.debug('notes.list response:', data);

      // Tolerant parsing: backend might return array or object with items/notes
      let parsed: any[] = [];
      if (Array.isArray(data)) parsed = data;
      else if (data && Array.isArray((data as any).items)) parsed = (data as any).items;
      else if (data && Array.isArray((data as any).notes)) parsed = (data as any).notes;
      else if (data && typeof data === 'object' && (data as any).id) parsed = [data as any];
      else parsed = [];

      setNotes(parsed);
      setLoadError(null);
    } catch (e) {
      console.error('Failed to load notes', e);
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => { load(); }, []);

  // Reload notes when other parts of the app signal data changed (login/create/etc.)
  useEffect(() => {
    const onDataChanged = () => { load(); };
    window.addEventListener('dataChanged', onDataChanged);
    return () => window.removeEventListener('dataChanged', onDataChanged);
  }, []);

  // Modal form state
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // Edit form state
  const [editOpen, setEditOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  // View form state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingNote, setViewingNote] = useState<any | null>(null);

  const handleNew = async () => {
    setOpen(true);
  };

  const submitNew = async () => {
    try {
      const token = localStorage.getItem('access_token') || undefined;
      await notesAPI.create(title, content, token);
      setOpen(false);
      setTitle("");
      setContent("");
      await load();
      // notify other parts of app
      window.dispatchEvent(new Event('dataChanged'));
    } catch (e) {
      console.error('Failed to create note', e);
      alert('Failed to create note');
    }
  };

  const startEdit = (note: any) => {
    setEditingNote(note);
    setEditTitle(note.title || "");
    setEditContent(note.content || "");
    setEditOpen(true);
  };

  const startView = (note: any) => {
    setViewingNote(note);
    setViewOpen(true);
  };

  const submitEdit = async () => {
    if (!editingNote) return;
    try {
      const token = localStorage.getItem('access_token') || undefined;
      await notesAPI.update(editingNote.id, editTitle, editContent, token);
      setEditOpen(false);
      setEditingNote(null);
      setEditTitle("");
      setEditContent("");
      await load();
      window.dispatchEvent(new Event('dataChanged'));
    } catch (e) {
      console.error('Failed to update note', e);
      alert('Failed to update note');
    }
  };

  const handleDelete = async (note: any) => {
    if (!confirm('Delete this note? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('access_token') || undefined;
      await notesAPI.delete(note.id, token);
      await load();
      window.dispatchEvent(new Event('dataChanged'));
    } catch (e) {
      console.error('Failed to delete note', e);
      alert('Failed to delete note');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Notes</h1>
            <p className="text-muted-foreground">Organize your learning materials</p>
          </div>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create New Note</AlertDialogTitle>
                <AlertDialogDescription>Enter a title and content for your note.</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-2">
                <input
                  className="border rounded p-2"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  className="border rounded p-2 h-32"
                  placeholder="Content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={submitNew}>Create</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Notes</CardTitle>
            <CardDescription>Create and manage your study notes</CardDescription>
          </CardHeader>
          <CardContent>
            {loadError && (
              <div className="mb-4 p-2 bg-yellow-50 text-yellow-800 rounded">
                Warning: failed to load notes: {loadError}
              </div>
            )}
            {/* If user is not authenticated, prompt to login */}
            {!localStorage.getItem('access_token') ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-6">Please sign in to view and create notes.</p>
                <div className="flex items-center justify-center">
                  <Button onClick={() => window.location.href = '/login'}>Sign in</Button>
                </div>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-6">No notes yet. Create your first note to get started!</p>
                <div className="flex items-center justify-center">
                  <Button onClick={handleNew}>Create Note</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map(n => (
                  <div key={n.id} className="border rounded p-3 relative">
                    <div className="absolute right-3 top-3 flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(n)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(n)}>Delete</Button>
                    </div>
                    <div className="cursor-pointer" onClick={() => startView(n)}>
                      <h3 className="font-semibold">{n.title}</h3>
                      <p className="text-sm text-muted-foreground">{n.content}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-4">
                  <Button onClick={handleNew} variant="ghost">Create another note</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Edit Note Modal */}
        <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Note</AlertDialogTitle>
              <AlertDialogDescription>Modify the title and content then save.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-2">
              <input
                className="border rounded p-2"
                placeholder="Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <textarea
                className="border rounded p-2 h-32"
                placeholder="Content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEditOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={submitEdit}>Save</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Note Modal (readable, with quick edit/delete) */}
        <AlertDialog open={viewOpen} onOpenChange={setViewOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{viewingNote ? viewingNote.title : 'View Note'}</AlertDialogTitle>
              <AlertDialogDescription>Read your note. Use Edit to modify it.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-2">
              <div className="whitespace-pre-wrap p-2 border rounded bg-white text-sm">{viewingNote ? viewingNote.content : ''}</div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setViewOpen(false)}>Close</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (viewingNote) { startEdit(viewingNote); setViewOpen(false); } }}>Edit</AlertDialogAction>
              <AlertDialogAction onClick={() => { if (viewingNote) { handleDelete(viewingNote); setViewOpen(false); } }}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Notes;
