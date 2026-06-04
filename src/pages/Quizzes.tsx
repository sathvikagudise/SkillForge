import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { filesAPI, quizAPI } from "@/services/api";

interface Quiz {
  id: number;
  title: string;
  questions: Array<{
    question: string;
    options: string[];
    correct_index: number;
    explanation?: string;
    source_page?: number;
  }>;
}

const Quizzes = () => {
  const [file, setFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<{ [k: number]: number }>({});
  const [result, setResult] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
  };

  const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestionCount(Math.max(1, parseInt(e.target.value) || 10));
  };

  const handleCreateQuiz = async () => {
    if (!file) {
      alert('Please select a PDF file');
      return;
    }
    if (questionCount < 1) {
      alert('Question count must be at least 1');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || undefined;
      
      // Upload file
      const uploadResp = await filesAPI.uploadFile(file, token);
      const fileId = uploadResp?.file_id;
      if (!fileId) throw new Error('File upload failed');

      // Generate quiz with specified question count
      const quiz = await quizAPI.generate(fileId, questionCount, token);
      
      // Reset form and close modal
      setFile(null);
      setQuestionCount(10);
      setShowCreateModal(false);
      
      // Reload quizzes list
      await loadQuizzes();
      
      // Open the new quiz
      if (quiz && quiz.id) {
        openQuiz(quiz.id);
      }
      
      // Notify other components
      window.dispatchEvent(new Event('dataChanged'));
    } catch (e: any) {
      console.error('Failed to create quiz', e);
      const msg = e?.message || (typeof e === 'string' ? e : 'Unknown error');
      setErrorMsg(msg);
      alert(`Failed to create quiz: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizzes = async () => {
    try {
      const token = localStorage.getItem('access_token') || undefined;
      const list = await quizAPI.list(token);
      setQuizzes(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load quizzes', e);
    }
  };

  const deleteQuiz = async (id: number) => {
    if (!confirm('Delete this quiz?')) return;
    try {
      const token = localStorage.getItem('access_token') || undefined;
      // Note: delete endpoint may not exist yet; add to backend if needed
      setQuizzes(quizzes.filter(q => q.id !== id));
      if (currentQuiz?.id === id) {
        setCurrentQuiz(null);
      }
      window.dispatchEvent(new Event('dataChanged'));
    } catch (e: any) {
      console.error('Failed to delete quiz', e);
      const msg = e?.message || (typeof e === 'string' ? e : 'Unknown error');
      setErrorMsg(msg);
      alert(`Failed to delete quiz: ${msg}`);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const openQuiz = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token') || undefined;
      const q = await quizAPI.get(id, token);
      setCurrentQuiz(q);
      setAnswers({});
      setResult(null);
    } catch (e) {
      console.error('Failed to open quiz', e);
      alert('Failed to open quiz');
    }
  };

  const selectOption = (qIdx: number, optIdx: number) => {
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const submitQuiz = async () => {
    if (!currentQuiz) return;
    try {
      const token = localStorage.getItem('access_token') || undefined;
      const resp = await quizAPI.submit(currentQuiz.id, answers, token);
      setResult(resp);
    } catch (e) {
      console.error('Failed to submit quiz', e);
      alert('Failed to submit quiz');
    }
  };

  const renderCreateModal = () => {
    if (!showCreateModal) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
          <h2 className="text-2xl font-bold">Create New Quiz</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Select PDF File</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              aria-label="Select PDF file"
              className="w-full px-3 py-2 border rounded-lg"
            />
            {file && <p className="text-sm text-green-600 mt-1">✓ {file.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Number of Questions</label>
            <input
              type="number"
              min="1"
              max="50"
              value={questionCount}
              onChange={handleQuestionCountChange}
              className="w-full px-3 py-2 border rounded-lg"
              aria-label="Number of questions"
            />
            <p className="text-xs text-muted-foreground mt-1">Generate {questionCount} question{questionCount !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setFile(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateQuiz} disabled={loading || !file}>
              {loading ? 'Generating...' : 'Generate Quiz'}
            </Button>
          </div>
            {errorMsg && <div className="text-sm text-red-600 mt-2">Error: {errorMsg}</div>}
        </div>
      </div>
    );
  };

  const renderQuizCard = () => {
    if (!currentQuiz || !currentQuiz.questions) return null;
    const qs = currentQuiz.questions || [];
    const answeredCount = Object.keys(answers).length;
    const allAnswered = answeredCount === qs.length;

    return (
      <Card>
        <CardHeader>
          <CardTitle>{currentQuiz.title}</CardTitle>
          <CardDescription>{qs.length} questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {qs.map((q: any, idx: number) => {
            const userAnswer = answers[idx];
            const isAnswered = userAnswer !== undefined;
            const correct = result ? result.details[idx]?.is_correct : null;

            return (
              <div key={idx} className="space-y-3">
                <div className="font-semibold">
                  Q{idx + 1}. {q.question}
                </div>

                <div className="space-y-2">
                  {(q.options || []).map((opt: string, oi: number) => {
                    const isSelected = userAnswer === oi;
                    const isCorrectOpt = result ? result.details[idx]?.correct_index === oi : false;
                    let bgColor = '';

                    if (result) {
                      if (isCorrectOpt) bgColor = 'bg-green-100 border-green-300';
                      else if (isSelected && !isCorrectOpt) bgColor = 'bg-red-100 border-red-300';
                    }

                    return (
                      <label
                        key={oi}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${bgColor}`}
                      >
                        <input
                          type="radio"
                          name={`q-${idx}`}
                          checked={isSelected}
                          onChange={() => !result && selectOption(idx, oi)}
                          disabled={!!result}
                        />
                        <span>{opt}</span>
                        {result && isCorrectOpt && <span className="ml-auto text-green-700 font-medium">✓</span>}
                      </label>
                    );
                  })}
                </div>

                {result && (
                  <div className="text-sm mt-2">
                    {correct ? (
                      <span className="text-green-700 font-medium">Correct!</span>
                    ) : (
                      <div>
                        <span className="text-red-700 font-medium">Incorrect</span>
                        {q.explanation && <p className="mt-1 text-muted-foreground">{q.explanation}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {result && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-900">
                {result.score}%
              </div>
              <div className="text-sm text-blue-700">
                {result.correct} correct out of {result.total}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-center pt-4">
            {!result && (
              <Button
                onClick={submitQuiz}
                disabled={!allAnswered || loading}
                size="lg"
              >
                {loading ? 'Submitting...' : `Submit Quiz (${answeredCount}/${qs.length})`}
              </Button>
            )}
            {result && (
              <Button
                onClick={() => {
                  setCurrentQuiz(null);
                  setAnswers({});
                  setResult(null);
                }}
                variant="outline"
              >
                Back to List
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (currentQuiz) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Quiz</h1>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentQuiz(null);
                setAnswers({});
                setResult(null);
              }}
            >
              ← Back to Quizzes
            </Button>
          </div>
          {renderQuizCard()}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quizzes</h1>
            <p className="text-muted-foreground">Test your knowledge and track progress</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Quiz
            </Button>
          </div>
        </div>

        {renderCreateModal()}

        <Card>
          <CardHeader>
            <CardTitle>Your Quizzes</CardTitle>
            <CardDescription>
              {quizzes.length === 0 ? 'Create a quiz to get started' : `You have ${quizzes.length} quiz${quizzes.length !== 1 ? 'zes' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quizzes.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                No quizzes yet. Click "Create New Quiz" to upload a PDF and generate questions.
              </p>
            ) : (
              <div className="space-y-2">
                {quizzes.map(quiz => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => openQuiz(quiz.id)}
                  >
                    <div>
                      <div className="font-medium">{quiz.title}</div>
                      <div className="text-sm text-muted-foreground">
                            {quiz.questions?.length || 0} questions {(!quiz.questions || quiz.questions.length === 0) && <span className="text-xs text-red-600 ml-2">(No questions)</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuiz(quiz.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

export default Quizzes;
