import { useState } from 'react';
// aiAPI removed; backend will trigger processing automatically after upload
import { uploadPdfLocal } from '@/snippets/uploadLocal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  userId: number;
  token: string;
  onUploadComplete?: (fileId: number) => void;
}

export default function FileUpload({ userId, token, onUploadComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Upload file directly to backend (multipart/form-data)
      setProgress(25);
      const authHeader = () => ({ Authorization: `Bearer ${token}` });

      setProgress(50);
      const res = await uploadPdfLocal(file, authHeader);
      const { file_id } = res;

      // Backend processes file automatically after upload
      setProgress(75);
      setProcessing(true);

      setProgress(100);
      setSuccess(`File "${file.name}" uploaded successfully! Processing started.`);
      setFile(null);

      // Reset after 2 seconds
      setTimeout(() => {
        if (onUploadComplete) {
          onUploadComplete(file_id);
        }
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setProgress(0);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>Upload a PDF to generate study materials</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert><AlertDescription className="text-green-700">{success}</AlertDescription></Alert>}

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={uploading || processing}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="text-gray-600">
              {file ? (
                <p className="font-semibold">{file.name}</p>
              ) : (
                <>
                  <p>Click to select a PDF file</p>
                  <p className="text-sm text-gray-500">or drag and drop</p>
                </>
              )}
            </div>
          </label>
        </div>

        {progress > 0 && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-gray-600">{progress}% complete</p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading || processing}
          className="w-full"
        >
          {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Upload & Process'}
        </Button>
      </CardContent>
    </Card>
  );
}
