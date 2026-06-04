import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Brain, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { flashcardsAPI, aiAPI } from "@/services/api";
import React from "react";
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

type FlashcardData = {
  id: number;
  question: string;
  answer: string;
  difficulty: string;
  easiness_factor?: number;
  interval?: number;
  review_count?: number;
  next_review_date?: string;
  last_quality?: number;
  source_file_id?: number;
};

const Flashcards = () => {
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [dueCount, setDueCount] = useState(0);

  const load = async () => {
    try {
      const token = localStorage.getItem('access_token') || undefined;
      if (!token) { setCards([]); return; }
      const data = await flashcardsAPI.list(token);
      setCards(Array.isArray(data) ? data : []);
      try {
        const due = await flashcardsAPI.due(1, token);
        const parsed = typeof due === 'object' && due !== null ? due as any : { total: 0 };
        setDueCount(parsed.total || 0);
      } catch {}
    } catch (e) {
      console.error('Failed to load flashcards', e);
    }
  };

  useEffect(() => {
    load();
    const handleDataChanged = () => load();
    window.addEventListener('dataChanged', handleDataChanged);
    return () => window.removeEventListener('dataChanged', handleDataChanged);
  }, []);

  const [open, setOpen] = useState(false);
  const [termInput, setTermInput] = useState("");
  const [loadingDef, setLoadingDef] = useState(false);
  const [countTerms, setCountTerms] = useState("3");
  const [previewCards, setPreviewCards] = useState<FlashcardData[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Review mode state
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewCards, setReviewCards] = useState<FlashcardData[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewFlipped, setReviewFlipped] = useState(false);
  const [reviewQuality, setReviewQuality] = useState<number | null>(null);
  const [reviewConfidence, setReviewConfidence] = useState(0.5);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [reviewStartTime, setReviewStartTime] = useState<number>(0);
  const [loadingReview, setLoadingReview] = useState(false);

  const startReview = async () => {
    const token = localStorage.getItem('access_token') || undefined;
    if (!token) { alert('Sign in to review'); return; }
    try {
      const data = await flashcardsAPI.due(50, token);
      const parsed = typeof data === 'object' && data !== null ? data as any : { cards: [] };
      const due = parsed.cards || [];
      if (due.length === 0) { alert('No cards due for review!'); return; }
      setReviewCards(due);
      setReviewIndex(0);
      setReviewFlipped(false);
      setReviewQuality(null);
      setReviewResult(null);
      setReviewStartTime(Date.now());
      setReviewMode(true);
    } catch (e) {
      console.error('Failed to load due cards', e);
      alert('Failed to load due cards');
    }
  };

  const submitReview = async () => {
    if (reviewQuality === null) { alert('Rate your recall quality'); return; }
    const card = reviewCards[reviewIndex];
    const token = localStorage.getItem('access_token') || undefined;
    if (!token) return;
    setLoadingReview(true);
    const responseTime = Date.now() - reviewStartTime;
    try {
      const result = await flashcardsAPI.review(
        card.id, reviewQuality, token,
        reviewConfidence, responseTime
      );
      setReviewResult(result);
    } catch (e) {
      console.error('Review failed', e);
      alert('Failed to submit review');
    } finally {
      setLoadingReview(false);
    }
  };

  const nextCard = () => {
    if (reviewIndex + 1 < reviewCards.length) {
      setReviewIndex(reviewIndex + 1);
      setReviewFlipped(false);
      setReviewQuality(null);
      setReviewResult(null);
      setReviewStartTime(Date.now());
    } else {
      setReviewMode(false);
      load();
      window.dispatchEvent(new Event('dataChanged'));
    }
  };

  const qualityLabels = [
    "Complete blackout", "Incorrect; correct remembered", "Incorrect; correct easy",
    "Correct with difficulty", "Correct after hesitation", "Perfect response"
  ];

  const qualityColors = [
    "bg-red-500", "bg-red-300", "bg-orange-300",
    "bg-yellow-300", "bg-green-300", "bg-green-500"
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Flashcards</h1>
            <p className="text-muted-foreground">Master concepts through spaced repetition</p>
          </div>
          <div className="flex gap-2">
            {dueCount > 0 && (
              <Button onClick={startReview} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Review Due ({dueCount})
              </Button>
            )}
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Deck
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Generate Flashcards</AlertDialogTitle>
                  <AlertDialogDescription>Generate flashcards quickly by entering a term below.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-2">
                  <div className="pt-2 border-t mt-2">
                    <label className="block text-sm font-medium">Quick Add by Term</label>
                    <input
                      className="border rounded p-2 mt-1 w-full"
                      placeholder="Enter term (e.g. Osmosis)"
                      value={termInput}
                      onChange={(e) => setTermInput(e.target.value)}
                    />
                    <div className="pt-2 flex gap-2 items-center">
                      <input className="w-20 border rounded p-2" placeholder="Count" aria-label="count" value={countTerms} onChange={(e)=>setCountTerms(e.target.value)} />
                      <Button onClick={async () => {
                        if (!termInput) { alert('Enter a term'); return; }
                        const count = parseInt(countTerms || '3', 10) || 3;
                        setLoadingDef(true);
                        try {
                          const token = localStorage.getItem('access_token') || undefined;
                          const cards = await aiAPI.defineMany(termInput, count, token);
                          setPreviewCards(Array.isArray(cards) ? cards : []);
                          setPreviewOpen(true);
                        } catch (e) {
                          console.error('Failed to create flashcard from term', e);
                          alert(e instanceof Error ? e.message : 'Failed to generate');
                        } finally { setLoadingDef(false); }
                      }} disabled={loadingDef}>{loadingDef ? 'Generating...' : 'Generate'}</Button>
                    </div>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setOpen(false)}>Close</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Review Mode Overlay */}
        {reviewMode && reviewCards.length > 0 && (
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-green-600" />
                Review Mode
              </CardTitle>
              <CardDescription>
                Card {reviewIndex + 1} of {reviewCards.length}
                {!reviewResult && <span className="ml-2 text-xs text-muted-foreground">Click the card to reveal the answer, then rate your recall</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className="border-2 rounded-xl p-8 min-h-[200px] cursor-pointer hover:bg-gray-50 transition flex items-center justify-center"
                  onClick={() => !reviewResult && setReviewFlipped(!reviewFlipped)}
                >
                  <div className="text-center">
                    {!reviewFlipped ? (
                      <>
                        <div className="text-sm text-muted-foreground mb-2">Question</div>
                        <div className="text-xl font-semibold">{reviewCards[reviewIndex].question}</div>
                        <div className="text-xs text-muted-foreground mt-4">Tap to reveal answer</div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-muted-foreground mb-2">Answer</div>
                        <div className="text-lg">{reviewCards[reviewIndex].answer}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Quality Rating (shown after flipping) */}
                {reviewFlipped && !reviewResult && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">How well did you recall?</div>
                      <div className="grid grid-cols-3 gap-2">
                        {[0,1,2,3,4,5].map(q => (
                          <Button
                            key={q}
                            variant={reviewQuality === q ? "default" : "outline"}
                            className={`${reviewQuality === q ? qualityColors[q] : ''} text-xs h-auto py-2`}
                            onClick={() => setReviewQuality(q)}
                          >
                            {q}<br/><span className="text-[10px] opacity-80">{qualityLabels[q].split(" ")[0]}</span>
                        </Button>
                        ))}
                      </div>
                      {reviewQuality !== null && (
                        <div className="text-xs text-muted-foreground mt-1">{qualityLabels[reviewQuality]}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Confidence: {(reviewConfidence * 100).toFixed(0)}%</div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={reviewConfidence * 100}
                        onChange={(e) => setReviewConfidence(parseInt(e.target.value) / 100)}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Not confident</span>
                        <span>Very confident</span>
                      </div>
                    </div>

                    <Button
                      onClick={submitReview}
                      disabled={reviewQuality === null || loadingReview}
                      className="w-full"
                    >
                      {loadingReview ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </div>
                )}

                {/* Review Result */}
                {reviewResult && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-700">{reviewResult.easiness_factor}</div>
                          <div className="text-xs text-muted-foreground">Easiness Factor</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-700">{reviewResult.interval}d</div>
                          <div className="text-xs text-muted-foreground">Next Interval</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-700">#{reviewResult.review_count}</div>
                          <div className="text-xs text-muted-foreground">Reviews</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-700">
                            {reviewResult.next_review_date ? new Date(reviewResult.next_review_date).toLocaleDateString() : 'Now'}
                          </div>
                          <div className="text-xs text-muted-foreground">Next Review</div>
                        </div>
                      </div>
                    </div>

                    <Button onClick={nextCard} className="w-full">
                      {reviewIndex + 1 < reviewCards.length ? 'Next Card →' : 'Finish Review'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview modal for generated cards */}
        {previewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white p-4 rounded max-h-[80vh] overflow-auto w-[90%] md:w-2/3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Preview Generated Cards for "{termInput}"</h3>
                <div className="flex gap-2">
                  <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                  <Button onClick={async ()=>{
                    const token = localStorage.getItem('access_token') || undefined;
                    if (!token) { alert('Sign in to save generated cards'); return; }
                    try {
                      for (const c of previewCards) {
                        await flashcardsAPI.create(c.question || (c as any).question, c.answer || (c as any).answer, (c as any).difficulty || 'medium', token);
                      }
                      setPreviewOpen(false);
                      setTermInput('');
                      setPreviewCards([]);
                      await load();
                      window.dispatchEvent(new Event('dataChanged'));
                    } catch (e) {
                      console.error('Failed to save generated cards', e);
                      alert(e instanceof Error ? e.message : 'Failed to save generated cards');
                    }
                  }}>Save All</Button>
                </div>
              </div>
              <div className="grid gap-4">
                {previewCards.map((c,i)=> (
                  <div key={i} className="border rounded p-4">
                    <FlipCard question={c.question || (c as any).question} answer={c.answer || (c as any).answer} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your Flashcard Decks</CardTitle>
            <CardDescription>Study and review with flashcards</CardDescription>
          </CardHeader>
          <CardContent>
            {!localStorage.getItem('access_token') ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-6">Please sign in to view and create flashcards.</p>
                <Button onClick={() => window.location.href = '/login'}>Sign in</Button>
              </div>
            ) : cards.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No flashcard decks yet. Create your first deck!</p>
            ) : (
              <div className="space-y-4">
                {cards.map(c => (
                  <FlashcardItem key={c.id} card={c} onUpdate={load} onDelete={load} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Flashcards;

function FlipCard({ question, answer }: { question: string, answer: string }){
  const [flipped, setFlipped] = React.useState(false);
  return (
    <div className="p-3">
      <div className="mb-2 font-semibold">{question}</div>
      <div className="text-sm text-muted-foreground">{flipped ? (answer || '') : ((answer || '').substring(0, Math.min(140, (answer || '').length)) + ((answer || '').length>140? '...':''))}</div>
      <div className="pt-2">
        <Button onClick={()=>setFlipped(!flipped)}>{flipped ? 'Show Less' : 'Flip'}</Button>
      </div>
    </div>
  );
}

function FlashcardItem({ card, onUpdate, onDelete }: { card: FlashcardData; onUpdate: () => void; onDelete: () => void }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [editQuestion, setEditQuestion] = React.useState(card.question);
  const [editAnswer, setEditAnswer] = React.useState(card.answer);
  const [editDifficulty, setEditDifficulty] = React.useState(card.difficulty || 'medium');
  const [isFlipped, setIsFlipped] = React.useState(false);

  const handleSaveEdit = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { alert('Not authenticated'); return; }
    try {
      await flashcardsAPI.update(card.id, editQuestion, editAnswer, editDifficulty, token);
      setEditOpen(false);
      onUpdate();
      window.dispatchEvent(new Event('dataChanged'));
    } catch (e) {
      console.error('Failed to update card', e);
      alert(e instanceof Error ? e.message : 'Failed to update');
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { alert('Not authenticated'); return; }
    if (!confirm('Delete this card?')) return;
    try {
      await flashcardsAPI.delete(card.id, token);
      onDelete();
      window.dispatchEvent(new Event('dataChanged'));
    } catch (e) {
      console.error('Failed to delete card', e);
      alert(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const isDue = card.next_review_date && new Date(card.next_review_date) <= new Date();
  const nextDate = card.next_review_date ? new Date(card.next_review_date).toLocaleDateString() : 'Now';

  return (
    <div className="border rounded p-4 hover:bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="font-semibold text-lg">{card.question}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {isFlipped ? card.answer : (card.answer || '').substring(0, 100) + ((card.answer || '').length > 100 ? '...' : '')}
          </div>
        </div>
        <div className="flex gap-2">
          <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Edit Flashcard</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Question</label>
                  <input aria-label="Edit question" className="border rounded p-2 w-full mt-1" value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Answer</label>
                  <textarea aria-label="Edit answer" className="border rounded p-2 w-full mt-1 h-24" value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Difficulty</label>
                  <select aria-label="Edit difficulty" className="border rounded p-2 w-full mt-1" value={editDifficulty} onChange={(e) => setEditDifficulty(e.target.value)}>
                    <option>easy</option>
                    <option>medium</option>
                    <option>hard</option>
                  </select>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSaveEdit}>Save</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs bg-gray-200 rounded px-2 py-1">{card.difficulty || 'medium'}</span>
        <span className={`text-xs rounded px-2 py-1 ${isDue ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {isDue ? 'Due now' : `Next: ${nextDate}`}
        </span>
        <span className="text-xs text-muted-foreground">EF: {card.easiness_factor?.toFixed(1) || '2.5'}</span>
        <span className="text-xs text-muted-foreground">Reviews: {card.review_count || 0}</span>
        <Button variant="ghost" size="sm" onClick={() => setIsFlipped(!isFlipped)}>
          {isFlipped ? 'Hide' : 'Flip'}
        </Button>
      </div>
    </div>
  );
}
