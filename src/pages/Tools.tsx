import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
// StudyCalendar moved to Calendar page; Tools keeps timer only

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

function playAlarm() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.7);
    o.stop(ctx.currentTime + 1.8);
  } catch (e) {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=");
      audio.play().catch(() => {});
    } catch {}
  }
}

const Tools = () => {
  // Study Timer state
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessionLabel, setSessionLabel] = useState("Focus");
  const [sessionInitialSeconds, setSessionInitialSeconds] = useState<number>(25 * 60);
  const intervalRef = useRef<number | null>(null);

  // presets
  const builtInPresets = [
    { label: "Pomodoro (25)", seconds: 25 * 60 },
    { label: "Short Break (5)", seconds: 5 * 60 },
    { label: "Long Break (15)", seconds: 15 * 60 },
  ];

  type Preset = { id?: string; label: string; seconds: number };
  const [savedPresets, setSavedPresets] = useState<Preset[]>([]);
  const [customLabel, setCustomLabel] = useState("");
  const [customMinutes, setCustomMinutes] = useState<string>("25");

  // load saved presets from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tools_timer_presets");
      if (raw) setSavedPresets(JSON.parse(raw));
    } catch {}
  }, []);

  const persistPresets = (next: Preset[]) => {
    setSavedPresets(next);
    try {
      localStorage.setItem("tools_timer_presets", JSON.stringify(next));
    } catch {}
  };

  const addPreset = () => {
    const mins = parseInt(customMinutes || "0", 10);
    if (!customLabel || !mins || mins <= 0) return;
    const p: Preset = { id: String(Date.now()), label: customLabel, seconds: mins * 60 };
    persistPresets([...(savedPresets || []), p]);
    setCustomLabel("");
    setCustomMinutes("25");
  };

  const removePreset = (id?: string) => {
    if (!id) return;
    persistPresets((savedPresets || []).filter((s) => s.id !== id));
  };

  useEffect(() => {
    if (running) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            // finished
            setRunning(false);
            playAlarm();
            try {
              if (Notification && Notification.permission === "granted") {
                new Notification("Study Timer", { body: `${sessionLabel} session finished` });
              }
            } catch {}
            if (intervalRef.current) {
              window.clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // update daily totals when a focus session finishes
            try {
              const isFocus = /focus|pomodoro|pomodor/i.test(sessionLabel);
              if (isFocus) {
                // add session seconds to today's total (store minutes)
                const key = new Date().toISOString().slice(0, 10);
                try {
                  const raw = localStorage.getItem('tools_timer_daily_totals');
                  const map = raw ? JSON.parse(raw) : {};
                  const prevMinutes = parseInt(map[key] || '0', 10);
                  // compute elapsed minutes from initial session length
                  const elapsedSeconds = Math.max(0, (sessionInitialSeconds || 0) - (s || 0));
                  const addMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
                  map[key] = prevMinutes + addMinutes;
                  localStorage.setItem('tools_timer_daily_totals', JSON.stringify(map));
                  setDailyTotals(map);
                } catch {}
              }
            } catch {}
            return 0;
          }
          return s - 1;
        });
      }, 1000) as unknown as number;
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, sessionLabel]);

  // Pause timer when document becomes hidden (user switches tabs/sections)
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && running) {
        setRunning(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [running]);

  // Ensure timer is stopped when component unmounts (e.g., user navigates to another section)
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setRunning(false);
    };
  }, []);

  // Daily totals map: { 'YYYY-MM-DD': minutes }
  const [dailyTotals, setDailyTotals] = useState<Record<string, number>>({});

  // load daily totals
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tools_timer_daily_totals');
      if (raw) setDailyTotals(JSON.parse(raw));
    } catch {}
  }, []);

  const persistDailyTotals = (map: Record<string, number>) => {
    try {
      localStorage.setItem('tools_timer_daily_totals', JSON.stringify(map));
    } catch {}
  };

  const startTimer = () => {
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      try {
        Notification.requestPermission().catch(() => {});
      } catch {}
    }
    setRunning(true);
  };

  const pauseTimer = () => setRunning(false);
  const resetTimer = (seconds = 25 * 60) => {
    setRunning(false);
    setSecondsLeft(seconds);
    setSessionInitialSeconds(seconds);
  };

  // Note Converter state
  const [inputText, setInputText] = useState("");
  const [cards, setCards] = useState<Array<{ question: string; answer: string }>>([]);

  function naiveConvertToFlashcards(text: string) {
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const out: Array<{ question: string; answer: string }> = [];
    paragraphs.forEach((p) => {
      const sentences = p.match(/[^.!?]+[.!?]?/g) || [p];
      const answer = sentences[0].trim();
      const words = answer.split(/\s+/).slice(0, 6).join(" ");
      const question = answer.endsWith("?") ? answer : `What is ${words}${words.endsWith(".") ? "" : "?"}`;
      out.push({ question, answer: p });
    });
    return out;
  }

  const handleConvert = () => {
    const result = naiveConvertToFlashcards(inputText || "");
    setCards(result);
  };

  const downloadJSON = (payload: any, filename = "flashcards.json") => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMarkdown = () => {
    const md = cards.map((c, i) => `### Q${i + 1}: ${c.question}\n\n${c.answer}\n`).join("\n---\n\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcards.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tools</h1>
          <p className="text-muted-foreground">Helpful utilities for your learning</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Study Timer</CardTitle>
              <CardDescription>Pomodoro and focus sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="text-4xl font-mono">{formatTime(secondsLeft)}</div>
                <div className="flex gap-2 flex-wrap">
                  {builtInPresets.map((p) => (
                    <Button
                      key={p.label}
                      variant="outline"
                      onClick={() => {
                        resetTimer(p.seconds);
                        setSessionLabel(p.label.split(" ")[0]);
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                  {(savedPresets || []).map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          resetTimer(p.seconds);
                          setSessionLabel(p.label);
                        }}
                      >
                        {p.label}
                      </Button>
                      <Button variant="ghost" onClick={() => removePreset(p.id)}>Remove</Button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Preset label (e.g. Focus)" />
                  <Input value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} placeholder="Minutes" />
                  <Button onClick={() => { resetTimer(parseInt(customMinutes || "0", 10) * 60 || 25 * 60); setSessionLabel(customLabel || "Custom"); }}>Set</Button>
                  <Button variant="outline" onClick={addPreset}>Save Preset</Button>
                </div>
                <div className="flex gap-2">
                  {!running ? (
                    <Button onClick={startTimer}>Start</Button>
                  ) : (
                    <Button variant="destructive" onClick={pauseTimer}>Pause</Button>
                  )}
                  <Button variant="ghost" onClick={() => resetTimer(25 * 60)}>Reset</Button>
                </div>
                <div className="text-sm text-muted-foreground">Session: {sessionLabel}</div>
                    {/* Calendar moved to Calendar page */}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Note Converter</CardTitle>
              <CardDescription>Transform notes into flashcards or markdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste notes here (paragraphs separated by blank line)." />
                <div className="flex gap-2">
                  <Button onClick={handleConvert}>Convert to Flashcards</Button>
                  <Button variant="outline" onClick={() => { setInputText(""); setCards([]); }}>Clear</Button>
                </div>

                {cards.length > 0 && (
                  <div>
                    <div className="mb-2 flex gap-2">
                      <Button onClick={() => downloadJSON(cards)}>Download JSON</Button>
                      <Button variant="outline" onClick={downloadMarkdown}>Download Markdown</Button>
                    </div>
                    <div className="space-y-2">
                      {cards.map((c, i) => (
                        <div key={i} className="p-3 border rounded">
                          <div className="font-semibold">Q{i + 1}: {c.question}</div>
                          <div className="text-sm text-muted-foreground mt-1">{c.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Tools;
