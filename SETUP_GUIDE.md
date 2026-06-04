# Complete Setup Guide: Frontend ↔ Backend Connection

## 🎯 Overview
You have a React/TypeScript frontend built with Lovable and a FastAPI backend with Celery workers. This guide walks you through **every step** to connect them, test, and deploy locally.

---

## 📋 PREREQUISITES CHECKLIST

Before starting, **verify you have all of these**:

- ✅ **Python 3.11+**
  ```
  python --version
  ```
  If not: https://www.python.org/downloads/

- ✅ **XAMPP running** (MySQL + Apache)
  - Start XAMPP Control Panel
  - Click "Start" next to MySQL
  - Verify: http://localhost/phpmyadmin (should load)

- ✅ **Redis running** (for Celery)
  - Download: https://github.com/microsoftarchive/redis/releases (Windows)
  - Or use WSL: `wsl -- redis-server`

- ✅ **Node.js 16+** (for frontend dev server)
  ```
  node --version
  npm --version
  ```

- ✅ **Google Cloud credentials**
  - GCS bucket created
  - Service account JSON downloaded
  - Path ready (e.g., `C:\keys\gcp-creds.json`)

- ✅ **Gemini API key**
  - From https://ai.google.dev/

---

## 🔧 STEP 1: Create Backend `.env` File

**Location:** `backend/app/.env`

**Create the file with these values:**

```env
# Database
DATABASE_URL=mysql+pymysql://root:your_mysql_password@127.0.0.1:3306/learnbuddy

# Google Cloud
GCS_PROJECT=your-gcp-project-id
GCS_BUCKET=your-bucket-name
GCS_CREDENTIALS_JSON=C:\path\to\gcp-creds.json

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_FAST_MODEL=gemini-1.5-flash
GEMINI_PRO_MODEL=gemini-1.5-pro

# JWT Authentication
JWT_SECRET=super_secret_key_change_in_production_12345
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Redis & Celery
REDIS_URL=redis://localhost:6379/0

# URLs
API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Google OAuth (optional - for later)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Replace these values:**
- `your_mysql_password` → your XAMPP MySQL password (default: empty or "root")
- `your-gcp-project-id` → your GCP project ID
- `your-bucket-name` → your GCS bucket name
- `C:\path\to\gcp-creds.json` → full path to your GCP service account JSON
- `your_gemini_api_key_here` → your Gemini API key from https://ai.google.dev/

---

## 🐍 STEP 2: Setup Python Virtual Environment

**Open PowerShell in the workspace root** (`c:\Users\hp\Desktop\cmlp-portal-main`)

```powershell
# Create virtual environment
python -m venv backend\venv

# Activate it
backend\venv\Scripts\Activate.ps1

# If you get execution policy error, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Then try Activate.ps1 again

# Upgrade pip
python -m pip install --upgrade pip

# Install all requirements
pip install -r backend\app\requirements.txt
```

**Expected output:** You should see packages installing. This takes ~2-3 minutes.

**Verify installation:**
```powershell
python -c "import fastapi; import sqlalchemy; print('✅ All core packages installed')"
```

---

## 🗄️ STEP 3: Create MySQL Database

**Open phpMyAdmin in your browser:**
```
http://localhost/phpmyadmin
```

**Or use MySQL CLI (if installed):**
```powershell
mysql -u root -p
```

**Run this SQL:**
```sql
CREATE DATABASE learnbuddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE learnbuddy;
SHOW TABLES;  -- should be empty
```

**Copy-paste the CREATE DATABASE command above into phpMyAdmin SQL tab and execute.**

---

## 📍 STEP 4: Set Google Credentials Environment Variable

**PowerShell (for this session):**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\gcp-creds.json"
```

**Or permanent (Windows):**
1. Press `Win + X` → System Settings
2. Search "Environment Variables"
3. Click "Edit the system environment variables"
4. Click "Environment Variables..."
5. Click "New" (under System variables)
   - Variable name: `GOOGLE_APPLICATION_CREDENTIALS`
   - Variable value: `C:\path\to\gcp-creds.json`
6. Click OK, OK, OK
7. Restart PowerShell

---

## 🚀 STEP 5: Create Database Tables

**With virtual environment activated** (you should see `(venv)` in PowerShell prompt):

```powershell
cd backend

# Run FastAPI to auto-create tables
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**Verify tables created:**
- Go to http://localhost:8000/health
- Should return `{"status":"ok"}`
- Check phpMyAdmin: http://localhost/phpmyadmin
- Select `learnbuddy` database → click "Tables" tab
- You should see tables: `user`, `user_file`, etc.

**Leave this running (don't close the terminal)**

---

## 🔴 STEP 6: Start Redis Server

**Open a NEW PowerShell window** (keep the FastAPI window open):

**Option A: If you installed Redis for Windows**
```powershell
# Navigate to Redis folder (e.g., C:\redis)
redis-server.exe

# Expected: "Ready to accept connections"
```

**Option B: If using WSL2**
```powershell
wsl -- redis-server
```

**Option C: If using Docker**
```powershell
docker run -d -p 6379:6379 redis:latest
```

**Verify Redis is running:**
```powershell
# In another new PowerShell window
redis-cli ping
# Expected: PONG
```

**Leave Redis running**

---

## 🔄 STEP 7: Start Celery Worker

**Open another NEW PowerShell window** (keep FastAPI and Redis running):

```powershell
# Navigate to backend
cd backend

# Activate venv
venv\Scripts\Activate.ps1

# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info
```

**Expected output:**
```
[*] Connected to redis://localhost:6379/0
[*] mingle: there is no on_connect handler set, rejecting on_connect event.
[*] celery@YOUR-PC ready.
```

**Leave Celery running**

---

## ✅ STEP 8: Test Backend with curl Commands

**Open a FOURTH PowerShell window** for testing:

### Test 1: Health Check
```powershell
curl http://localhost:8000/health

# Expected response:
# {"status":"ok"}
```

### Test 2: Signup
```powershell
$body = @{
    email = "testuser@example.com"
    password = "Test1234!"
    name = "Test User"
} | ConvertTo-Json

curl -X POST http://localhost:8000/auth/signup `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body

# Expected: {"user_id":1,"email":"testuser@example.com","name":"Test User"}
```

### Test 3: Login
```powershell
$loginBody = @{
    email = "testuser@example.com"
    password = "Test1234!"
} | ConvertTo-Json

$loginResponse = curl -X POST http://localhost:8000/auth/login `
  -Headers @{"Content-Type"="application/json"} `
  -Body $loginBody

# Expected: {"access_token":"eyJ0...","token_type":"bearer"}
# SAVE this token for next steps
```

### Test 4: Upload Flow (3-part)

**Part A: Get presigned URL**
```powershell
$presignBody = @{
    filename = "test.pdf"
    user_id = 1
} | ConvertTo-Json

$presignResponse = curl -X POST http://localhost:8000/files/presign `
  -Headers @{"Content-Type"="application/json"} `
  -Body $presignBody

# Response: {"file_id": 1, "upload_url": "...", "gcs_path": "..."}
# Save file_id (should be 1)
```

**Part B: Upload file to GCS** (create a test PDF first)
```powershell
# Create a simple test file
"test pdf content" | Out-File -Path test.pdf -Encoding UTF8

# Upload using the presigned URL (replace URL from response above)
curl -X PUT "https://storage.googleapis.com/YOUR-BUCKET/..." `
  -Headers @{"Content-Type"="application/pdf"} `
  -InFile test.pdf
```

**Part C: Trigger processing**
```powershell
curl -X POST http://localhost:8000/files/1/process `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN"}

# Expected: {"status":"processing_started"}
# Check Celery worker terminal - should see task picked up
```

### Test 5: AI Endpoints (after file processes)

**Wait 10 seconds for file to process, then:**

```powershell
$summaryBody = @{
    file_id = 1
    length = "medium"
} | ConvertTo-Json

curl -X POST http://localhost:8000/api/ai/summarize `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN"; "Content-Type"="application/json"} `
  -Body $summaryBody

# Expected: {"summary": "..."}
```

---

## 🎨 STEP 9: Create Frontend Auth Hook

**Create file:** `src/hooks/useAuth.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';

interface User {
  user_id: number;
  email: string;
  name: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      setToken(savedToken);
      loadUser(savedToken);
    }
  }, []);

  const loadUser = async (accessToken: string) => {
    try {
      const response = await fetch('http://localhost:8000/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const signup = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Signup failed');
      }

      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const authData: AuthResponse = await response.json();
      setToken(authData.access_token);
      localStorage.setItem('access_token', authData.access_token);

      // Load user data
      await loadUser(authData.access_token);

      return authData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
  }, []);

  return {
    user,
    token,
    loading,
    error,
    signup,
    login,
    logout,
    isAuthenticated: !!token,
  };
};
```

---

## 📡 STEP 10: Create Frontend API Service

**Create file:** `src/services/api.ts`

```typescript
const API_URL = 'http://localhost:8000';

export const apiCall = async (
  endpoint: string,
  options: RequestInit & { token?: string } = {}
) => {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  signup: (email: string, password: string, name: string) =>
    apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: (token: string) =>
    apiCall('/auth/me', { token }),
};

// Files API
export const filesAPI = {
  presignUpload: (filename: string, userId: number) => {
    const formData = new FormData();
    formData.append('filename', filename);
    formData.append('user_id', userId.toString());

    return fetch(`${API_URL}/files/presign`, {
      method: 'POST',
      body: formData,
    }).then(r => r.json());
  },

  processFile: (fileId: number, token: string) =>
    apiCall(`/files/${fileId}/process`, {
      method: 'POST',
      token,
    }),

  listFiles: (token: string) =>
    apiCall('/files/', { token }),

  getFile: (fileId: number, token: string) =>
    apiCall(`/files/${fileId}`, { token }),
};

// AI API
export const aiAPI = {
  summarize: (fileId: number, length: 'short' | 'medium' | 'long', token: string) =>
    apiCall('/api/ai/summarize', {
      method: 'POST',
      token,
      body: JSON.stringify({ file_id: fileId, length }),
    }),

  generateFlashcards: (fileId: number, count: number, token: string) =>
    apiCall('/api/ai/flashcards/generate', {
      method: 'POST',
      token,
      body: JSON.stringify({ file_id: fileId, count }),
    }),

  generateQuiz: (fileId: number, count: number, token: string) =>
    apiCall('/quiz/generate', {
      method: 'POST',
      token,
      body: JSON.stringify({ file_id: fileId, count }),
    }),

  generateNotes: (fileId: number, token: string) =>
    apiCall('/api/ai/notes', {
      method: 'POST',
      token,
      body: JSON.stringify({ file_id: fileId }),
    }),
};
```

---

## 🔐 STEP 11: Update Login Page to Connect Backend

**Update file:** `src/pages/Login.tsx`

Replace the entire file with:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your LearnBuddy account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-indigo-600 hover:underline">
              Sign up
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## ✍️ STEP 12: Update Signup Page to Connect Backend

**Update file:** `src/pages/Signup.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await signup(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Join LearnBuddy today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 hover:underline">
              Sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📤 STEP 13: Create Upload Component

**Create file:** `src/components/FileUpload.tsx`

```typescript
import { useState } from 'react';
import { filesAPI, aiAPI } from '@/services/api';
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
      // Step 1: Get presigned URL
      setProgress(25);
      const presignData = await filesAPI.presignUpload(file.name, userId);
      const { file_id, upload_url } = presignData;

      // Step 2: Upload to GCS
      setProgress(50);
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/pdf' },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // Step 3: Trigger processing
      setProgress(75);
      setProcessing(true);
      await aiAPI.generateNotes(file_id, token);

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
```

---

## 🏃 STEP 14: Quick Start Script (Automation)

**Create file:** `start-all.ps1` in workspace root

```powershell
# This script starts all required services

Write-Host "🚀 Starting LearnBuddy Services..." -ForegroundColor Green

# Check if virtual environment exists
if (!(Test-Path "backend\venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv backend\venv
}

# Activate venv
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& backend\venv\Scripts\Activate.ps1

# Start FastAPI in background
Write-Host "Starting FastAPI server..." -ForegroundColor Green
$fastapi = Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`"" -PassThru

# Start Celery worker in background
Write-Host "Starting Celery worker..." -ForegroundColor Green
$celery = Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend; venv\Scripts\Activate.ps1; celery -A app.tasks.celery_app worker --loglevel=info`"" -PassThru

# Start frontend dev server
Write-Host "Starting frontend dev server..." -ForegroundColor Green
$frontend = Start-Process powershell -ArgumentList "-NoExit -Command `"npm run dev`"" -PassThru

Write-Host "`n✅ All services started!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔌 Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop all services" -ForegroundColor Yellow

# Wait for termination
Wait-Process -Id $fastapi.Id -ErrorAction SilentlyContinue
Wait-Process -Id $celery.Id -ErrorAction SilentlyContinue
Wait-Process -Id $frontend.Id -ErrorAction SilentlyContinue
```

---

## 🎯 COMMON ISSUES & FIXES

### Issue: "ModuleNotFoundError: No module named 'fastapi'"
**Fix:** Virtual environment not activated
```powershell
backend\venv\Scripts\Activate.ps1
pip install -r backend\app\requirements.txt
```

### Issue: "CORS error" when calling backend from frontend
**Fix:** Backend CORS is configured. If still failing:
- Check `FRONTEND_URL` in `.env` matches your frontend URL
- Ensure backend is running

### Issue: "Redis connection refused"
**Fix:** Redis not running
```powershell
redis-server  # or run redis via WSL/Docker
```

### Issue: "FAISS error: ImportError"
**Fix:** Install faiss wheel for your OS
```powershell
pip install faiss-cpu==1.7.4
# If fails, try: pip install faiss-cpu --prefer-binary
```

### Issue: "GCS authentication failed"
**Fix:** Check Google credentials
```powershell
# Verify file exists
Test-Path "C:\path\to\gcs-credentials.json"

# Set environment variable
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\gcs-credentials.json"
```

### Issue: MySQL "Access denied for user 'root'"
**Fix:** Update DATABASE_URL in `.env`
```env
DATABASE_URL=mysql+pymysql://root:your_password@127.0.0.1:3306/learnbuddy
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                     │
│  Login → Dashboard → Upload PDF → View Summaries/Flashcards │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    HTTP REST API
                    (http://localhost:8000)
                           │
        ┌──────────────────┴──────────────────┐
        │                                      │
┌───────▼────────────────┐         ┌──────────▼──────────────┐
│   FastAPI Backend      │         │   Celery Worker Queue   │
│  - Auth (JWT)          │         │  - PDF Processing       │
│  - File Management     │         │  - Embeddings           │
│  - AI API Endpoints    │         │  - Gemini Calls         │
│  - Database (SQLAlchemy)          └──────────┬──────────────┘
└───────┬────────────────┘                     │
        │                                      │
        ├─────────────────┬────────────────────┤
        │                 │                    │
   ┌────▼──┐         ┌───▼───┐          ┌────▼────┐
   │ MySQL │         │ Redis │          │   GCS   │
   │Database            Queue               Storage
   └───────┘         └───────┘          └─────────┘
```

---

## ✨ Next Steps After Setup

1. ✅ Complete steps 1-7 above
2. ✅ Test backend endpoints (step 8)
3. ✅ Wire frontend hooks (steps 9-13)
4. ✅ Test full flow: Login → Upload → View Results
5. 🔄 Add rate limiting for Gemini API costs
6. 🔄 Implement file deletion & user workspace management
7. 🔄 Add real-time notifications with WebSockets
8. 🔄 Deploy to production (AWS/GCP/Heroku)

---

## 📞 Support

If you get stuck:
1. Check the logs in each terminal window
2. Verify all services are running (4 terminals)
3. Test with curl commands to isolate the issue
4. Check `.env` values are correct

**Happy coding! 🎉**
