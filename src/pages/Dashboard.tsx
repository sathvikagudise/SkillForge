import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  CreditCard, 
  Brain, 
  Calendar,
  Map,
  Route,
  Play
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { notesAPI, flashcardsAPI, quizAPI } from "@/services/api";

const Dashboard = () => {
  const [notesCount, setNotesCount] = useState<number | null>(null);
  const [flashcardsCount, setFlashcardsCount] = useState<number | null>(null);
  const [quizzesCount, setQuizzesCount] = useState<number | null>(null);
  const [dueCount, setDueCount] = useState<number>(0);
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      setNotesCount(0);
      setFlashcardsCount(0);
      setQuizzesCount(0);
      return;
    }

    Promise.all([
      notesAPI.list(token).catch(() => []),
      flashcardsAPI.list(token).catch(() => []),
      quizAPI.list(token).catch(() => []),
      flashcardsAPI.due(1, token).catch(() => ({ total: 0 })),
    ]).then(([notes, cards, quizzes, due]) => {
      setNotesCount(Array.isArray(notes) ? notes.length : 0);
      setFlashcardsCount(Array.isArray(cards) ? cards.length : 0);
      setQuizzesCount(Array.isArray(quizzes) ? quizzes.length : 0);
      setDueCount(typeof due === 'object' && due !== null ? (due as any).total || 0 : 0);
    });
  }, [isAuthenticated, token]);

  useEffect(() => {
    const reload = async () => {
      if (!isAuthenticated) {
        setNotesCount(0);
        setFlashcardsCount(0);
        setQuizzesCount(0);
        return;
      }
      const [notes, cards, quizzes, due] = await Promise.all([
        notesAPI.list(token).catch(() => []),
        flashcardsAPI.list(token).catch(() => []),
        quizAPI.list(token).catch(() => []),
        flashcardsAPI.due(1, token).catch(() => ({ total: 0 })),
      ]);
      setNotesCount(Array.isArray(notes) ? notes.length : 0);
      setFlashcardsCount(Array.isArray(cards) ? cards.length : 0);
      setQuizzesCount(Array.isArray(quizzes) ? quizzes.length : 0);
      setDueCount(typeof due === 'object' && due !== null ? (due as any).total || 0 : 0);
    };
    window.addEventListener('dataChanged', reload);
    return () => window.removeEventListener('dataChanged', reload);
  }, [isAuthenticated, token]);

  const quickActions = [
    {
      title: "Create Notes",
      description: "Start a new note",
      icon: BookOpen,
      href: "/notes",
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Study Flashcards",
      description: dueCount > 0 ? `${dueCount} card${dueCount > 1 ? 's' : ''} due for review` : "Review your cards",
      icon: CreditCard,
      href: "/flashcards",
      color: dueCount > 0 ? "bg-green-100 text-green-700" : "bg-accent/10 text-accent"
    },
    {
      title: "Take Quiz",
      description: "Test your knowledge",
      icon: Brain,
      href: "/quizzes",
      color: "bg-success/10 text-success"
    },
    {
      title: "Knowledge Graph",
      description: "Visualize concept connections",
      icon: Map,
      href: "/knowledge-graph",
      color: "bg-purple-100 text-purple-700"
    },
    {
      title: "Learning Path",
      description: "Optimized study sequence",
      icon: Route,
      href: "/learning-path",
      color: "bg-orange-100 text-orange-700"
    },
    {
      title: "View Calendar",
      description: "Check schedule",
      icon: Calendar,
      href: "/calendar",
      color: "bg-info/10 text-info"
    },
  ];

  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const onProfile = () => setRefreshKey((k) => k + 1);
    window.addEventListener('profileUpdated', onProfile);
    return () => window.removeEventListener('profileUpdated', onProfile);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">{`Welcome Back${(user?.name || localStorage.getItem('user_profile_name')) ? `, ${user?.name || localStorage.getItem('user_profile_name')}` : ''}!`}</CardTitle>
            <CardDescription className="text-primary-foreground/80 text-base">
              Ready to continue your learning journey?
            </CardDescription>
          </CardHeader>
        </Card>

        {dueCount > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-green-800">{dueCount} flashcard{dueCount > 1 ? 's' : ''} due for review</p>
                <p className="text-sm text-green-600">Spaced repetition cards ready for practice</p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => navigate('/flashcards')}>
                <Play className="w-4 h-4 mr-2" />
                Review Now
              </Button>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Card key={action.title} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      navigate(action.href);
                    }}
                  >
                    Get Started →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Notes</CardDescription>
                <CardTitle className="text-3xl">{notesCount ?? '—'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{notesCount ? `+${Math.max(0, Math.round(notesCount/5))} this week` : ''}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Flashcards Mastered</CardDescription>
                <CardTitle className="text-3xl">{flashcardsCount ?? '—'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {dueCount > 0 ? `${dueCount} due for review` : flashcardsCount ? 'All caught up!' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Quizzes Completed</CardDescription>
                <CardTitle className="text-3xl">{quizzesCount ?? '—'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{quizzesCount ? `Average: ${Math.min(100, 70 + quizzesCount)}%` : ''}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
