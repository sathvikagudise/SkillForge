# 🧪 Complete Testing & Troubleshooting Guide

## Quick Test Checklist

Use this to verify each component is working before moving to the next step.

### Phase 1: Backend Infrastructure ✅

- [ ] **Python & venv activated**
  ```powershell
  python --version  # Should be 3.11+
  pip list | grep fastapi  # Should show fastapi
  ```

- [ ] **MySQL running**
  ```
  Open http://localhost/phpmyadmin
  Should load without errors
  ```

- [ ] **Redis running**
  ```powershell
  redis-cli ping
  # Expected: PONG
  ```

- [ ] **Google credentials set**
  ```powershell
  echo $env:GOOGLE_APPLICATION_CREDENTIALS
  # Should show path to JSON file
  ```

### Phase 2: Backend Endpoints 🔌

**Terminal 1: Start FastAPI**
```powershell
cd backend
uvicorn app.main:app --reload
```

**Terminal 2: Test endpoints**

1. **Health endpoint**
   ```powershell
   curl http://localhost:8000/health
   # ✅ Response: {"status":"ok"}
   ```

2. **Signup endpoint**
   ```powershell
   $body = @{
       email = "test1@example.com"
       password = "Test1234!"
       name = "Test User"
   } | ConvertTo-Json

   $response = curl -X POST http://localhost:8000/auth/signup `
     -Headers @{"Content-Type"="application/json"} `
     -Body $body

   $response | ConvertFrom-Json

   # ✅ Response: user_id, email, name
   ```

3. **Login endpoint**
   ```powershell
   $loginBody = @{
       email = "test1@example.com"
       password = "Test1234!"
   } | ConvertTo-Json

   $loginResponse = curl -X POST http://localhost:8000/auth/login `
     -Headers @{"Content-Type"="application/json"} `
     -Body $loginBody

   $loginResult = $loginResponse | ConvertFrom-Json
   $token = $loginResult.access_token

   # Save token for next tests
   $env:TEST_TOKEN = $token

   # ✅ Response: access_token, token_type
   ```

4. **Protected endpoint (requires token)**
   ```powershell
   curl http://localhost:8000/files/ `
     -Headers @{"Authorization"="Bearer $env:TEST_TOKEN"}

   # ✅ Response: JSON array of files
   ```

### Phase 3: Celery Worker 🔄

**Terminal 3: Start Celery worker**
```powershell
cd backend
venv\Scripts\Activate.ps1
celery -A app.tasks.celery_app worker --loglevel=info
```

**Expected output:**
```
[*] Connected to redis://localhost:6379/0
[*] mingle: there is no on_connect handler set, rejecting on_connect event.
[*] celery@YOUR-COMPUTER ready.
```

### Phase 4: File Upload Flow 📤

**Terminal 2: Test presign endpoint**

```powershell
# Create a test PDF
"Test PDF Content" | Out-File -Path test.pdf -Encoding UTF8

# Get presigned URL
$presignBody = @{
    filename = "test.pdf"
    user_id = 1
} | ConvertTo-Json

$presignResponse = curl -X POST http://localhost:8000/files/presign `
  -Headers @{"Content-Type"="application/json"} `
  -Body $presignBody

$presignResult = $presignResponse | ConvertFrom-Json
$fileId = $presignResult.file_id
$uploadUrl = $presignResult.upload_url

Write-Host "File ID: $fileId"
Write-Host "Upload URL: $uploadUrl"
# ✅ Should get file_id and upload_url
```

**Upload to GCS**
```powershell
curl -X PUT $uploadUrl `
  -Headers @{"Content-Type"="application/pdf"} `
  -InFile test.pdf

# ✅ Should return 200 OK
```

**Trigger processing**
```powershell
curl -X POST http://localhost:8000/files/$fileId/process `
  -Headers @{"Authorization"="Bearer $env:TEST_TOKEN"}

# ✅ Response: {"status":"processing_started"}
# Watch Terminal 3 (Celery) for task execution
```

### Phase 5: AI Endpoints 🤖

**Wait 30 seconds for processing, then test:**

```powershell
# Generate summary
$summaryBody = @{
    file_id = $fileId
    length = "medium"
} | ConvertTo-Json

curl -X POST http://localhost:8000/api/ai/summarize `
  -Headers @{"Authorization"="Bearer $env:TEST_TOKEN"; "Content-Type"="application/json"} `
  -Body $summaryBody

# ✅ Response: {"summary": "..."}
```

---

## 🆘 Common Issues & Solutions

### Issue 1: "ModuleNotFoundError: No module named 'fastapi'"

**Symptoms:** FastAPI won't start, python import error

**Solution:**
```powershell
# Check venv is activated
python -m venv backend\venv
backend\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r backend\app\requirements.txt --force-reinstall
```

---

### Issue 2: "Database connection failed"

**Symptoms:** "pymysql.err.OperationalError: (2003, "Can't connect to MySQL...")"

**Solutions:**

1. **Check XAMPP MySQL is running**
   - Open XAMPP Control Panel
   - Click "Start" next to MySQL
   - Wait 5 seconds

2. **Verify .env DATABASE_URL**
   ```
   # In backend/app/.env
   DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@127.0.0.1:3306/learnbuddy
   ```
   Replace `YOUR_PASSWORD` with your actual password

3. **Check MySQL credentials**
   ```powershell
   mysql -u root -p
   # Enter password and press Enter
   ```

4. **Create database if missing**
   ```sql
   CREATE DATABASE learnbuddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

---

### Issue 3: "Redis connection refused"

**Symptoms:** "ConnectionError: Error 111 connecting to localhost:6379"

**Solution:**

**Option A: Windows Redis**
```powershell
# Download from: https://github.com/microsoftarchive/redis/releases
# Extract and run:
redis-server.exe
```

**Option B: WSL Redis**
```powershell
wsl -- redis-server
```

**Option C: Docker Redis**
```powershell
docker run -d -p 6379:6379 redis:latest
```

**Verify:**
```powershell
redis-cli ping
# Expected: PONG
```

---

### Issue 4: "CORS error" when calling backend from frontend

**Symptoms:** Browser console shows "Access to XMLHttpRequest blocked by CORS"

**Solution:**
1. Verify FRONTEND_URL in `backend/app/.env`
   ```env
   FRONTEND_URL=http://localhost:3000
   FRONTEND_URL=http://localhost:5173  # If using Vite
   ```

2. Make sure backend is restarted after .env change
   ```powershell
   # Stop FastAPI (Ctrl+C in the terminal)
   # Then restart:
   uvicorn app.main:app --reload
   ```

3. Check API calls use correct URL
   ```typescript
   // In frontend API service
   const API_URL = 'http://localhost:8000';  // Not 127.0.0.1
   ```

---

### Issue 5: "FAISS error: ImportError"

**Symptoms:** "ImportError: cannot import name 'SWIG_object_new' from 'faiss.swigfaiss_avx2'"

**Solution:**

**Option A: Install specific faiss wheel**
```powershell
pip install faiss-cpu==1.7.4 --prefer-binary
```

**Option B: Use alternative library**
```powershell
pip uninstall faiss-cpu -y
pip install hnswlib==0.7.0
```

Then update backend code to use hnswlib instead:
```python
# Instead of FAISS:
from hnswlib import Index

index = Index(space='l2', dim=768)
index.init_index(max_elements=100000, ef_construction=200, M=16)
```

---

### Issue 6: "GCS authentication failed"

**Symptoms:** "google.auth.exceptions.DefaultCredentialsError"

**Solution:**

1. **Verify credentials file exists**
   ```powershell
   Test-Path "C:\path\to\gcs-creds.json"
   # Should return: True
   ```

2. **Set environment variable**
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\gcs-creds.json"
   ```

3. **Add to .env file**
   ```env
   GCS_CREDENTIALS_JSON=C:\path\to\gcs-creds.json
   ```

4. **Restart FastAPI after changes**

5. **Verify credentials have correct permissions**
   - GCS bucket access
   - Create/read/write objects permission

---

### Issue 7: "Gemini API key invalid"

**Symptoms:** "google.api_core.exceptions.InvalidArgument: 400 Invalid API key"

**Solution:**

1. **Get a valid API key**
   - Go to https://ai.google.dev/
   - Click "Get API Key"
   - Create new project or select existing
   - Copy the API key

2. **Update .env**
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Restart FastAPI**

4. **Test with curl**
   ```powershell
   curl -X POST http://localhost:8000/api/ai/summarize `
     -Headers @{"Authorization"="Bearer $env:TEST_TOKEN"; "Content-Type"="application/json"} `
     -Body '{"file_id":1,"length":"short"}'
   ```

---

### Issue 8: "JWT token errors"

**Symptoms:** "Could not validate credentials" when accessing protected endpoints

**Solution:**

1. **Check JWT_SECRET in .env**
   ```env
   JWT_SECRET=your_secret_key_minimum_32_chars_long
   ```

2. **Verify token format in requests**
   ```powershell
   # Correct format:
   curl http://localhost:8000/files/ `
     -Headers @{"Authorization"="Bearer eyJ0..."}

   # Wrong: Using "Token" instead of "Bearer"
   curl http://localhost:8000/files/ `
     -Headers @{"Authorization"="Token eyJ0..."}  # ❌ WRONG
   ```

3. **Check token expiration**
   ```powershell
   # Token is valid for 10080 minutes by default (~7 days)
   ACCESS_TOKEN_EXPIRE_MINUTES=10080
   ```

---

### Issue 9: "Celery task not running"

**Symptoms:** Processing doesn't start, task not appearing in worker logs

**Solution:**

1. **Verify Celery worker is running**
   ```powershell
   # Check Terminal 3 is running Celery
   # Should show: "celery@YOUR-PC ready."
   ```

2. **Check Redis URL matches in both**
   ```env
   # backend/app/.env
   REDIS_URL=redis://localhost:6379/0
   ```

3. **Check Celery config**
   ```python
   # app/tasks/celery_app.py
   # Should have: broker='redis://localhost:6379/0'
   ```

4. **Restart services in order**
   ```powershell
   # 1. Keep Redis running
   # 2. Restart FastAPI (Ctrl+C, then restart)
   # 3. Restart Celery worker
   ```

5. **Enable debug logging**
   ```powershell
   celery -A app.tasks.celery_app worker --loglevel=debug
   ```

---

### Issue 10: "Frontend can't connect to backend"

**Symptoms:** Network error when login/signup, stuck on loading

**Solution:**

1. **Verify backend is running**
   ```powershell
   curl http://localhost:8000/health
   # Should return: {"status":"ok"}
   ```

2. **Check API_URL in frontend**
   ```typescript
   // src/services/api.ts
   const API_URL = 'http://localhost:8000';
   ```

3. **Verify CORS is enabled**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try login
   - Look for CORS error in response headers

4. **Check firewall**
   ```powershell
   # Windows Defender might block port 8000
   # Add exception if needed
   ```

5. **Use proxy approach (if still failing)**
   ```powershell
   # Add to package.json "proxy": "http://localhost:8000"
   ```

---

## 📊 Debug Checklist

When nothing works, go through this:

```powershell
# 1. Check all services running
redis-cli ping                              # Should: PONG
curl http://localhost:8000/health          # Should: {"status":"ok"}
curl http://localhost:3000                  # Should: HTML response

# 2. Check logs
# Terminal 1 (FastAPI): Ctrl+C, check for errors
# Terminal 2 (Celery): Look for task logs
# Terminal 3 (Frontend): Look for build errors

# 3. Check configuration
cat backend\app\.env                        # Verify all values
Test-Path $env:GOOGLE_APPLICATION_CREDENTIALS  # Should exist

# 4. Test database
mysql -u root -p
USE learnbuddy;
SHOW TABLES;  # Should show tables

# 5. Check ports are free
netstat -ano | findstr :8000   # Check port 8000
netstat -ano | findstr :3000   # Check port 3000
netstat -ano | findstr :6379   # Check port 6379
```

---

## 🚀 Quick Fix: Nuclear Option

If everything fails, start fresh:

```powershell
# Kill all processes
Stop-Process -Name "python" -Force
Stop-Process -Name "node" -Force
Stop-Process -Name "redis-server" -Force

# Clean and reinstall
Remove-Item backend\venv -Recurse
python -m venv backend\venv
backend\venv\Scripts\Activate.ps1
pip install -r backend\app\requirements.txt

# Restart services
# (Follow Quick Start section)
```

---

## ✅ Success Checklist

When everything is working:

- ✅ Health endpoint returns {"status":"ok"}
- ✅ Can signup with email/password
- ✅ Can login and get JWT token
- ✅ Can upload PDF file
- ✅ Celery processes file and creates embeddings
- ✅ Can call AI endpoints and get summaries
- ✅ Frontend shows all data correctly
- ✅ No errors in any console/terminal

**If all checkboxes are ticked, you're ready to deploy! 🎉**
