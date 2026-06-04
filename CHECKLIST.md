# 📋 COMPLETE SETUP CHECKLIST & ACTION PLAN

## PART A: PRE-FLIGHT CHECKS (Do This First!)

### Prerequisites Verification

- [ ] **Python 3.11+**
  ```powershell
  python --version
  # Expected output: Python 3.11.x or higher
  ```
  If not installed: https://www.python.org/downloads/

- [ ] **Node.js 16+**
  ```powershell
  node --version
  npm --version
  # Expected: v16.0.0 or higher
  ```
  If not installed: https://nodejs.org/

- [ ] **XAMPP with MySQL**
  ```
  Open http://localhost/phpmyadmin
  Should load without errors
  ```
  If not: https://www.apachefriends.org/

- [ ] **Git** (optional but recommended)
  ```powershell
  git --version
  ```

### Credentials Ready

- [ ] Google Cloud Project ID
- [ ] GCS Bucket name
- [ ] GCP Service Account JSON file path
- [ ] Gemini API key
- [ ] MySQL password (default is blank for XAMPP)

**Store all these in a safe location (text file) - you'll need them in Step 1!**

---

## PART B: IMMEDIATE ACTIONS (Follow in Order)

### STEP 1: Create `.env` File ⚙️

**Location:** `backend/app/.env`

**Action:**
1. Copy `backend/app/.env.example` to `backend/app/.env`
   ```powershell
   Copy-Item backend\app\.env.example backend\app\.env
   ```

2. Open `backend/app/.env` in VS Code

3. Replace these values with YOUR credentials:
   ```env
   DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@127.0.0.1:3306/learnbuddy
   GCS_PROJECT=your-gcp-project-id
   GCS_BUCKET=your-bucket-name
   GCS_CREDENTIALS_JSON=C:\full\path\to\gcp-creds.json
   GEMINI_API_KEY=your-api-key-here
   JWT_SECRET=make-this-very-long-and-random-string-at-least-32-chars
   ```

4. Save file

**Verify:**
```powershell
cat backend\app\.env | Select-String "DATABASE_URL"
# Should show your database URL
```

---

### STEP 2: Setup Python Environment 🐍

**Open PowerShell in workspace root** (`c:\Users\hp\Desktop\cmlp-portal-main`)

**Action:**
```powershell
# Create virtual environment
python -m venv backend\venv

# Activate it
backend\venv\Scripts\Activate.ps1

# You should see (venv) in prompt

# Upgrade pip
python -m pip install --upgrade pip

# Install all requirements
pip install -r backend\app\requirements.txt
```

**This will take 3-5 minutes - be patient!**

**Verify:**
```powershell
python -c "import fastapi; import sqlalchemy; print('✅ Setup successful')"
```

---

### STEP 3: Setup MySQL Database 🗄️

**Open http://localhost/phpmyadmin in browser**

**Action:**

1. If prompted, login with:
   - Username: `root`
   - Password: (leave blank, just press Enter)

2. Click "New" or "Create database"

3. Database name: `learnbuddy`

4. Collation: `utf8mb4_unicode_ci`

5. Click "Create"

**Alternative using MySQL CLI:**
```powershell
mysql -u root -p
# Enter password (leave blank if none)

CREATE DATABASE learnbuddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT
```

**Verify:**
```powershell
mysql -u root -e "SHOW DATABASES;" | findstr learnbuddy
# Should show: learnbuddy
```

---

### STEP 4: Set Google Credentials Environment Variable 📍

**Permanent Setup (Recommended):**

1. Press `Win + X`
2. Select "System"
3. Scroll down → "Advanced system settings"
4. Click "Environment Variables..."
5. Click "New" under "System variables"
6. Variable name: `GOOGLE_APPLICATION_CREDENTIALS`
7. Variable value: `C:\full\path\to\your\gcp-creds.json`
8. Click OK × 3
9. Restart PowerShell

**Or Temporary (Session Only):**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\full\path\to\gcp-creds.json"
```

**Verify:**
```powershell
echo $env:GOOGLE_APPLICATION_CREDENTIALS
# Should show your path
```

---

### STEP 5: Start Redis 🔴

**Choose ONE option:**

**Option A: Windows Redis**
1. Download: https://github.com/microsoftarchive/redis/releases
2. Extract to `C:\redis` (or your choice)
3. Open PowerShell in that folder
4. Run: `redis-server.exe`

**Option B: WSL2 (if you have it)**
```powershell
wsl -- redis-server
```

**Option C: Docker**
```powershell
docker run -d -p 6379:6379 redis:latest
```

**Leave this running in a terminal!**

**Verify:**
```powershell
redis-cli ping
# Expected: PONG
```

---

### STEP 6: Start FastAPI Backend 🚀

**New PowerShell window** (keep Redis running):

```powershell
cd backend

# Activate venv if not already activated
venv\Scripts\Activate.ps1

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**Leave this running!**

**Verify in browser:**
```
http://localhost:8000/health
Should show: {"status":"ok"}
```

---

### STEP 7: Start Celery Worker 🔄

**New PowerShell window** (keep FastAPI running):

```powershell
cd backend

# Activate venv
venv\Scripts\Activate.ps1

# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info
```

**Expected output:**
```
[*] Connected to redis://localhost:6379/0
[*] celery@YOUR-PC ready.
```

**Leave this running!**

---

### STEP 8: Install Frontend Dependencies 📦

**New PowerShell window** (keep other 3 running):

```powershell
npm install
```

**This will take 2-3 minutes**

**Verify:**
```powershell
ls node_modules | head -5
# Should show folders
```

---

### STEP 9: Start Frontend Dev Server 🎨

**Same PowerShell window:**

```powershell
npm run dev
```

**Expected output:**
```
  VITE v5.4.19  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

**Leave this running!**

---

## PART C: TESTING (All services should be running!)

**You should now have 4 terminals open:**
1. ✅ Terminal 1: FastAPI (http://localhost:8000)
2. ✅ Terminal 2: Celery Worker
3. ✅ Terminal 3: Frontend (http://localhost:5173)
4. (Redis in background or another terminal)

### Test 1: Health Check ✅

Open http://localhost:8000/health in browser

Expected: `{"status":"ok"}`

---

### Test 2: Signup 👤

Open http://localhost:5173 in browser

1. Click "Sign Up"
2. Fill form:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `Test1234!`
3. Click "Sign Up"

Expected: Redirects to dashboard

---

### Test 3: Login 🔐

1. Click "Logout" (if signed in)
2. Go to Login page
3. Enter credentials from Test 2
4. Click "Sign In"

Expected: Redirects to dashboard, shows your email

---

### Test 4: Upload PDF 📄

1. Go to Dashboard
2. Click "Upload Document"
3. Select a PDF file (or create one: `echo "test" > test.pdf`)
4. Click "Upload & Process"

Expected:
- Upload progress shows 0-100%
- Status changes to "Processing..."
- After 30 seconds, shows completion message

---

### Test 5: Check Celery Logs 🔄

Look at **Terminal 2 (Celery Worker)**

You should see:
```
[2024-01-15 10:30:00,123: INFO/MainProcess] Task app.tasks.pdf_tasks.process_pdf_task[abc123] received
[2024-01-15 10:30:05,456: INFO/PoolWorker-1] Task successful
```

---

### Test 6: Test AI Endpoints 🤖

Using curl (or Postman):

**Get your token first:**
```powershell
# Login and save token
$response = curl -X POST http://localhost:8000/auth/login `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"Test1234!"}'

$token = ($response | ConvertFrom-Json).access_token
```

**Test summarize:**
```powershell
curl -X POST http://localhost:8000/api/ai/summarize `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body '{"file_id":1,"length":"medium"}'

# Expected: {"summary": "..."}
```

---

## PART D: VERIFY ALL COMPONENTS

Go through this final checklist:

### Backend Components
- [ ] Database tables created (check phpMyAdmin)
- [ ] Users table has test user
- [ ] UserFile table has uploaded file
- [ ] No errors in FastAPI terminal
- [ ] Celery worker is connected to Redis

### Frontend Components
- [ ] Login/Signup pages load
- [ ] Auth tokens saved in localStorage
- [ ] Can upload files
- [ ] Can view user data

### Integration
- [ ] Frontend calls backend successfully
- [ ] No CORS errors in browser console
- [ ] No auth errors when accessing protected endpoints
- [ ] Files appear in database after upload
- [ ] Celery processes files automatically

---

## PART E: COMMON ISSUES (If Something Breaks)

### Issue: "Database connection error"
```powershell
# Check MySQL is running
mysql -u root -p
# Type password and press Enter
# Should connect. Type: EXIT

# Check DATABASE_URL in .env is correct
cat backend\app\.env | Select-String DATABASE_URL
```

### Issue: "Redis connection refused"
```powershell
redis-cli ping
# Should return: PONG
# If not, start Redis server
```

### Issue: "CORS error in browser"
```powershell
# Check FRONTEND_URL in .env
cat backend\app\.env | Select-String FRONTEND_URL

# Should match your frontend URL (http://localhost:5173 or :3000)
# Restart FastAPI if you changed it
```

### Issue: "Module not found"
```powershell
# Check venv is activated
pip list | head
# Should show packages

# If empty, activate venv:
backend\venv\Scripts\Activate.ps1

# Then reinstall:
pip install -r backend\app\requirements.txt
```

### Issue: "Celery task not running"
```powershell
# Check Celery terminal shows "ready."
# Check Redis is running (redis-cli ping)
# Look at Celery logs for errors
# Restart Celery worker
```

**For more issues, see TESTING_GUIDE.md**

---

## PART F: AUTOMATED START

Instead of manually starting services, use the quick start script:

```powershell
.\start-all.ps1
```

This will:
1. Create venv if missing
2. Install dependencies
3. Check all prerequisites
4. Start FastAPI, Celery, and Frontend
5. Show you all the URLs

---

## 🎯 SUCCESS CRITERIA

You're done when:

- ✅ All 4 terminals show services running without errors
- ✅ http://localhost:8000/health returns `{"status":"ok"}`
- ✅ http://localhost:5173 loads in browser
- ✅ Can signup/login on frontend
- ✅ Can upload PDF from frontend
- ✅ Celery worker processes files (visible in terminal)
- ✅ Can call AI endpoints and get results
- ✅ No errors in browser console or terminal logs

---

## 🚀 NEXT STEPS AFTER SUCCESS

1. **Add more features:**
   - Knowledge graph generation
   - Quiz generation
   - Flashcard creation

2. **Improve UX:**
   - Real-time file processing notifications
   - Better error messages
   - Loading skeletons

3. **Optimize:**
   - Add caching
   - Rate limiting for API
   - Pagination for large lists

4. **Deploy:**
   - AWS/Google Cloud
   - Docker containers
   - CI/CD pipeline

---

## 📞 Quick Reference URLs

```
Frontend:          http://localhost:5173
Backend API:       http://localhost:8000
API Documentation: http://localhost:8000/docs
API ReDoc:         http://localhost:8000/redoc
Health Check:      http://localhost:8000/health
MySQL:             http://localhost/phpmyadmin
```

---

## 📖 Documentation Files

- **SETUP_GUIDE.md** - Detailed setup with all commands
- **TESTING_GUIDE.md** - Complete testing and troubleshooting
- **This file** - Quick checklist and overview

**Good luck! You've got this! 🎉**
