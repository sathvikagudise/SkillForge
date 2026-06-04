import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Notes = lazy(() => import("@/pages/Notes"));
const Flashcards = lazy(() => import("@/pages/Flashcards"));
const Quizzes = lazy(() => import("@/pages/Quizzes"));
const KnowledgeGraph = lazy(() => import("@/pages/KnowledgeGraph"));
const LearningPath = lazy(() => import("@/pages/LearningPath"));
const Tools = lazy(() => import("@/pages/Tools"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const Workspaces = lazy(() => import("@/pages/Workspaces"));
const Offline = lazy(() => import("@/pages/Offline"));
const Settings = lazy(() => import("@/pages/Settings"));
const OAuthSuccess = lazy(() => import("@/pages/OAuthSuccess"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const Loader = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-sm text-gray-400">Loading...</span>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/oauth-success" element={<OAuthSuccess />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
              <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
              <Route path="/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
              <Route path="/knowledge-graph" element={<ProtectedRoute><KnowledgeGraph /></ProtectedRoute>} />
              <Route path="/learning-path" element={<ProtectedRoute><LearningPath /></ProtectedRoute>} />
              <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
              <Route path="/workspaces" element={<ProtectedRoute><Workspaces /></ProtectedRoute>} />
              <Route path="/offline" element={<ProtectedRoute><Offline /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
