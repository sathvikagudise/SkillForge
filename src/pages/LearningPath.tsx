import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { learningPathAI, authAPI, filesAPI } from "@/services/api";
import { uploadPdfLocal } from "@/snippets/uploadLocal";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, CheckCircle2, Lock, BookOpen, Upload, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type NodeItem = {
  id: number;
  title: string;
  description?: string;
  estimated_time?: number;
  difficulty?: string;
};

type AINode = {
  id: string;
  title: string;
  topic?: string;
  estimated_time_min?: number;
  prerequisites?: string[];
};

type AIEdge = Record<string, string>;

const LearningPath = () => {
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [edges, setEdges] = useState<AIEdge[]>([]);
  const [recommended, setRecommended] = useState<NodeItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const { toast } = useToast();

  const init = async () => {
    try {
      const token = localStorage.getItem('access_token') || '';
      const me: any = await authAPI.getMe(token);
      setUserId(me.id);
      const fileData: any = await filesAPI.listFiles(token);
      setFiles(fileData?.files || fileData || []);
      if (me.id && fileData?.files?.length > 0) {
        await generatePath(me.id);
      }
    } catch {}
  };

  useEffect(() => { init(); }, []);

  const generatePath = async (uid: number) => {
    setGenerating(true);
    setNodes([]);
    setEdges([]);
    setRecommended(null);
    try {
      const token = localStorage.getItem('access_token') || '';
      const data: any = await learningPathAI.getPath(uid, token);
      const rawNodes: AINode[] = data.nodes || [];
      const rawEdges: AIEdge[] = data.edges || [];
      const recommendedNext: string | null = data.recommended_next || null;

      const nodeMap = new Map<string, number>();
      let nextId = 1;
      const converted: NodeItem[] = rawNodes.map((n) => {
        const id = typeof n.id === 'number' ? n.id : nextId++;
        nodeMap.set(String(n.id), id);
        return {
          id,
          title: n.title || n.id,
          description: n.topic || '',
          estimated_time: n.estimated_time_min || undefined,
          difficulty: 'medium',
        };
      });

      setNodes(converted);
      setEdges(rawEdges);

      if (recommendedNext) {
        const recId = nodeMap.get(recommendedNext);
        if (recId) {
          const found = converted.find((n) => n.id === recId);
          if (found) setRecommended(found);
        }
      }
    } catch (e: any) {
      toast({ title: "Failed to generate path", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const token = localStorage.getItem('access_token') || '';
      await uploadPdfLocal(uploadFile, () => ({ Authorization: `Bearer ${token}` }));
      setUploadSuccess(`"${uploadFile.name}" uploaded! Generating path...`);
      setUploadFile(null);
      const me: any = await authAPI.getMe(token);
      setUserId(me.id);
      const fileData: any = await filesAPI.listFiles(token);
      setFiles(fileData?.files || fileData || []);
      await generatePath(me.id);
      setUploadSuccess(null);
    } catch (e: any) {
      setUploadError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Learning Path</h1>
          <p className="text-muted-foreground">
            AI-generated learning path based on your uploaded materials
          </p>
        </div>

        {/* Recommended next */}
        {recommended && (
          <Card className="border-blue-400 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <ArrowRight className="h-5 w-5" />
                Recommended Starting Topic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{recommended.title}</div>
                  {recommended.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {recommended.description}
                    </div>
                  )}
                  <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
                    {recommended.estimated_time && (
                      <span>Estimated: ~{recommended.estimated_time} min</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>Upload a PDF to generate your learning path</CardDescription>
          </CardHeader>
          <CardContent>
            {uploadError && <Alert variant="destructive" className="mb-4"><AlertDescription>{uploadError}</AlertDescription></Alert>}
            {uploadSuccess && <Alert className="mb-4"><AlertDescription className="text-green-700">{uploadSuccess}</AlertDescription></Alert>}
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                disabled={uploading}
              />
              <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>

            {/* Previously uploaded files */}
            {files.length > 0 && userId && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Uploaded files ({files.length})</p>
                <div className="flex flex-wrap gap-2">
                  {files.map((f: any) => (
                    <div key={f.id} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                      <FileText className="h-3 w-3" />
                      {f.filename?.length > 25 ? f.filename.slice(0, 24) + '…' : f.filename}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => userId && generatePath(userId)}
                  disabled={generating}
                >
                  {generating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Regenerate Path
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All nodes */}
        <Card>
          <CardHeader>
            <CardTitle>Your Learning Journey</CardTitle>
            <CardDescription>
              Topics extracted from your uploaded materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generating && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Generating learning path...
              </div>
            )}
            {!generating && nodes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No topics yet. Upload a PDF above to generate your learning path.
              </div>
            )}

            {!generating && nodes.length > 0 && (
              <div className="space-y-0">
                {nodes.map((n, idx) => (
                  <div key={n.id} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 border-blue-500">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      {idx < nodes.length - 1 && (
                        <div className="w-0.5 flex-1 min-h-[24px] bg-gray-200" />
                      )}
                    </div>

                    {/* Content card */}
                    <div className={`flex-1 pb-6`}>
                      <div className="p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-semibold">{n.title}</div>
                          {n.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {n.description}
                            </div>
                          )}
                          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                            {n.estimated_time && <span>~{n.estimated_time} min</span>}
                          </div>
                        </div>
                      </div>
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

export default LearningPath;
