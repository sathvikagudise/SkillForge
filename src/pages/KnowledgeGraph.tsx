import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { knowledgeGraphAI, filesAPI, authAPI } from "@/services/api";
import { uploadPdfLocal } from "@/snippets/uploadLocal";
import GraphVisualization from "@/components/GraphVisualization";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, FileText } from "lucide-react";

type AINode = { id: string; label: string; metadata?: Record<string, any> };
type AIEdge = { source: string; target: string; label: string };

type GraphNode = { id: number; title: string; description?: string; difficulty?: string; estimated_time?: number };
type GraphEdge = { id: number; from_node_id: number; to_node_id: number; relation_type: string };

const KnowledgeGraph = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const loadFiles = async () => {
    try {
      const token = localStorage.getItem('access_token') || '';
      const data: any = await filesAPI.listFiles(token);
      setFiles(data?.files || data || []);
    } catch {}
  };

  useEffect(() => { loadFiles(); }, []);

  const generateGraph = async (fileId: number) => {
    setGenerating(true);
    setSelectedFileId(fileId);
    setNodes([]);
    setEdges([]);
    try {
      const token = localStorage.getItem('access_token') || '';
      const data: any = await knowledgeGraphAI.getGraphForFile(fileId, token);
      const rawNodes: AINode[] = data.nodes || [];
      const rawEdges: AIEdge[] = data.edges || [];

      const nodeMap = new Map<string, number>();
      let nextId = 1;
      const convertedNodes: GraphNode[] = rawNodes.map((n) => {
        const id = typeof n.id === 'number' ? n.id : nextId++;
        nodeMap.set(String(n.id), id);
        return {
          id,
          title: n.label || n.id,
          description: n.metadata?.description || '',
          difficulty: n.metadata?.difficulty || 'medium',
          estimated_time: n.metadata?.estimated_time || undefined,
        };
      });

      let edgeIdx = 0;
      const convertedEdges: GraphEdge[] = rawEdges.map((e) => {
        edgeIdx++;
        const fromId = nodeMap.get(String(e.source)) || nextId++;
        const toId = nodeMap.get(String(e.target)) || nextId++;
        return {
          id: edgeIdx,
          from_node_id: fromId,
          to_node_id: toId,
          relation_type: e.label || 'related',
        };
      });

      setNodes(convertedNodes);
      setEdges(convertedEdges);
    } catch (e: any) {
      toast({ title: "Failed to generate graph", description: e.message, variant: "destructive" });
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
      const res: any = await uploadPdfLocal(uploadFile, () => ({ Authorization: `Bearer ${token}` }));
      const fileId = res.file_id;
      setUploadSuccess(`"${uploadFile.name}" uploaded! Generating graph...`);
      setUploadFile(null);
      await loadFiles();
      await generateGraph(fileId);
      setUploadSuccess(null);
    } catch (e: any) {
      setUploadError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const graphWidth = containerRef.current?.clientWidth ?? 800;
  const graphHeight = Math.max(400, window.innerHeight * 0.55);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Graph</h1>
          <p className="text-muted-foreground">
            AI-generated knowledge graph from your uploaded PDFs
          </p>
        </div>

        {/* Upload section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>Upload a PDF to generate a knowledge graph</CardDescription>
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
            {files.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Previously uploaded files:</p>
                <div className="flex flex-wrap gap-2">
                  {files.map((f: any) => (
                    <Button
                      key={f.id}
                      variant={selectedFileId === f.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => generateGraph(f.id)}
                      disabled={generating}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      {f.filename?.length > 20 ? f.filename.slice(0, 19) + '…' : f.filename}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graph display */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Knowledge Network</CardTitle>
                <CardDescription>
                  Drag nodes · Scroll to zoom
                </CardDescription>
              </div>
              {generating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating graph...
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div ref={containerRef} className="w-full">
              {generating && (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Generating knowledge graph from AI...
                </div>
              )}
              {!generating && nodes.length === 0 && (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  No graph generated yet. Upload a PDF or click a file above to generate.
                </div>
              )}
              {!generating && nodes.length > 0 && (
                <GraphVisualization
                  nodes={nodes}
                  edges={edges}
                  statuses={{}}
                  width={graphWidth}
                  height={graphHeight}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default KnowledgeGraph;
