import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BookOpen, CreditCard, Brain, Route, Map, Sparkles, ArrowRight, CheckCircle2, BarChart3
} from "lucide-react";
import { useEffect, useState } from "react";

const features = [
  { icon: Brain, title: "AI-Powered Learning", desc: "Personalized study plans adapt to your pace and performance using advanced AI." },
  { icon: CreditCard, title: "Smart Flashcards", desc: "Enhanced SM-2 spaced repetition algorithm optimizes your review schedule." },
  { icon: Map, title: "Knowledge Graphs", desc: "Visualize connections between concepts and track your understanding." },
  { icon: Route, title: "Learning Paths", desc: "Optimized topic sequences based on prerequisites and your progress." },
  { icon: BookOpen, title: "Study Materials", desc: "Upload PDFs, generate summaries, quizzes, and flashcards automatically." },
  { icon: BarChart3, title: "Analytics", desc: "Track your learning velocity, retention rates, and knowledge gaps." },
];

const testimonials = [
  { quote: "The spaced repetition algorithm helped me retain 40% more information compared to traditional studying.", name: "Alex K.", role: "Computer Science Student" },
  { quote: "The knowledge graph visualization makes it so easy to see how different concepts connect. Game changer.", name: "Sarah M.", role: "Biology Researcher" },
  { quote: "I uploaded my lecture notes and had flashcards and quizzes generated in seconds. Incredible.", name: "James L.", role: "Medical Student" },
];

const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLoggedIn = !!localStorage.getItem("access_token");

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl">LearnBuddy</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#features" className="hover:text-gray-900">Features</a>
              <a href="#testimonials" className="hover:text-gray-900">Testimonials</a>
            </nav>
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
              ) : (
                <>
                  <Link to="/login"><Button variant="ghost">Sign In</Button></Link>
                  <Link to="/signup"><Button>Get Started</Button></Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm text-primary mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Personalized Learning Platform
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
            Learn Smarter,{" "}
            <span className="text-primary">Not Harder</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Upload your study materials and let AI transform them into interactive flashcards, quizzes, knowledge graphs, and optimized learning paths tailored to you.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="h-12 px-8 text-base">
                Start Learning Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                Sign In
              </Button>
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Free tier included</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Export anytime</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything You Need to Learn Effectively</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              From content ingestion to mastery tracking — a complete learning ecosystem powered by AI.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group p-6 rounded-xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "10K+", label: "Active Learners" },
            { value: "50K+", label: "Flashcards Created" },
            { value: "5K+", label: "Study Hours Tracked" },
            { value: "94%", label: "Retention Rate" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Loved by Learners</h2>
            <p className="mt-4 text-lg text-gray-500">See what our users say about their learning experience.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-xl bg-white border border-gray-100">
                <div className="flex mb-4">{[...Array(5)].map((_, i) => <Star key={i} />)}</div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-sm text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/5 to-accent/5 border border-primary/10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Transform Your Learning?</h2>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto">
              Join thousands of learners who are already using AI-powered tools to study more effectively.
            </p>
            <Link to="/signup">
              <Button size="lg" className="h-12 px-8 text-base">
                Get Started Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>LearnBuddy</span>
          </div>
          <div>Built with AI for better learning.</div>
        </div>
      </footer>
    </div>
  );
};

const Star = () => (
  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default Landing;
