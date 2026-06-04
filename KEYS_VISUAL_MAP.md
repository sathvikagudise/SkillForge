# 🗺️ VISUAL GUIDE: Keys, Where They Go, How to Get Them

## Overview: What Connects to What

```
YOUR FRONTEND (http://localhost:5173)
    ↓
    ├─→ Calls: http://localhost:8000 (Backend API)
    │
    │
YOUR BACKEND (http://localhost:8000)
    ├─→ Needs: DATABASE_URL (MySQL)
    ├─→ Needs: GEMINI_API_KEY (Google AI)
    ├─→ Needs: GCS credentials (Google Storage)
    ├─→ Needs: JWT_SECRET (Token signing)
    └─→ Needs: REDIS_URL (Task queue)
         ↓
    ├─→ MySQL Database
    ├─→ Google Gemini API
    ├─→ Google Cloud Storage
    └─→ Redis Queue
```

---

## 📋 All Keys You Need

### Key 1: DATABASE_URL ✅ (You Already Have This!)
```
What: MySQL database connection string
Where to get: Your computer (XAMPP)
Where to put: backend/app/.env
Format: mysql+pymysql://USERNAME:PASSWORD@HOST:PORT/DATABASE

EXAMPLE:
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/learnbuddy

Breaking it down:
├─ root = your MySQL username (default in XAMPP)
├─ (blank) = your MySQL password (often empty in XAMPP)
├─ 127.0.0.1 = localhost
├─ 3306 = default MySQL port
└─ learnbuddy = database name

FIRST TIME SETUP:
1. Open: http://localhost/phpmyadmin
2. Verify MySQL is running in XAMPP
3. Create database called "learnbuddy"
```

---

### Key 2: GEMINI_API_KEY ✨ (Free from Google)
```
What: Google's AI API key for content generation
Where to get: https://ai.google.dev/
Where to put: backend/app/.env

HOW TO GET:
1. Go to: https://ai.google.dev/
2. Click: "Get API Key"
3. Click: "Create API Key in new project"
4. Wait: For project to be created
5. Copy: Your API key (it's highlighted)
6. Paste: Into backend/app/.env

LOOKS LIKE: sk-1234567890abcdefghijklmnopqrstuvwxyz

IN .env FILE:
GEMINI_API_KEY=sk-1234567890abcdefghijklmnopqrstuvwxyz
GEMINI_FAST_MODEL=gemini-1.5-flash
GEMINI_PRO_MODEL=gemini-1.5-pro
```

---

### Key 3: GCS_PROJECT ☁️ (Google Cloud Storage)
```
What: Your Google Cloud project ID
Where to get: https://console.cloud.google.com/
Where to put: backend/app/.env

HOW TO GET:
1. Go to: https://console.cloud.google.com/
2. Create new project:
   - Click "Select Project" (top left)
   - Click "New Project"
   - Name: "learnbuddy" (or any name)
   - Create
3. Wait for project to load
4. Copy project ID from header
5. Paste into .env

LOOKS LIKE: my-learnbuddy-project-123456

IN .env FILE:
GCS_PROJECT=my-learnbuddy-project-123456
```

---

### Key 4: GCS_BUCKET 📦 (Storage Bucket Name)
```
What: Google Cloud Storage bucket for your PDFs
Where to get: https://console.cloud.google.com/storage/
Where to put: backend/app/.env

HOW TO GET:
1. Make sure you're in your project (GCS_PROJECT)
2. Go to: Storage → Buckets
3. Click: Create Bucket
4. Name: learnbuddy-pdfs (or any unique name)
5. Region: us-central1
6. Click: Create
7. Copy bucket name
8. Paste into .env

LOOKS LIKE: learnbuddy-pdfs

IN .env FILE:
GCS_BUCKET=learnbuddy-pdfs
```

---

### Key 5: GCS_CREDENTIALS_JSON 🔐 (Service Account Key)
```
What: JSON file with credentials to access GCS
Where to get: Google Cloud Service Account
Where to put: backend/app/.env (as file path)

HOW TO GET:
1. Go to: https://console.cloud.google.com/
2. Make sure you're in your project
3. Go to: IAM & Admin → Service Accounts
4. Click: Create Service Account
5. Name: learnbuddy-app
6. Grant roles: Storage Admin
7. Click: Create and Continue
8. Go to: Keys tab
9. Click: Add Key → Create new key → JSON
10. A file automatically downloads
11. Move file to safe location (e.g., C:\keys\learnbuddy-key.json)
12. Copy full path to .env

LOOKS LIKE: C:\Users\hp\Downloads\learnbuddy-key.json

IN .env FILE:
GCS_CREDENTIALS_JSON=C:\Users\hp\Downloads\learnbuddy-key.json

IMPORTANT:
- Never commit this file to Git!
- Keep it safe!
- Add to .gitignore
```

---

### Key 6: JWT_SECRET 🔑 (Token Secret - You Create This!)
```
What: Secret key for signing JWT tokens
Where to get: YOU CREATE IT (any random string)
Where to put: backend/app/.env

HOW TO CREATE:
1. Think of any random string (minimum 32 characters)
2. Make it random: mix letters, numbers, symbols
3. Example: "my-super-duper-secret-key-that-is-very-long-and-random-xyz123"

WHY IT MATTERS:
- Signs authentication tokens
- Keep it secret!
- Change in production

GOOD EXAMPLES:
JWT_SECRET=dksfjkl349@#$%dkfjklsfdjklfsjdklfj234
JWT_SECRET=production-secret-key-that-nobody-knows-12345
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

IN .env FILE:
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_ALGORITHM=HS256
```

---

### Key 7: REDIS_URL 🔴 (Task Queue)
```
What: Redis server connection for background tasks
Where to get: Your computer (or cloud)
Where to put: backend/app/.env

FOR LOCAL DEVELOPMENT:
REDIS_URL=redis://localhost:6379/0

WHAT THIS MEANS:
├─ redis:// = protocol
├─ localhost = your computer
├─ 6379 = default Redis port
└─ /0 = first database

HOW TO SET UP:
1. Download Redis for Windows:
   https://github.com/microsoftarchive/redis/releases
2. Or use WSL: wsl -- redis-server
3. Or use Docker: docker run -d -p 6379:6379 redis:latest
4. Verify: redis-cli ping (should return PONG)

IN .env FILE:
REDIS_URL=redis://localhost:6379/0
```

---

### Key 8: Frontend & API URLs 🌐
```
What: URLs for frontend and backend communication
Where to get: Your local setup
Where to put: backend/app/.env

FOR LOCAL DEVELOPMENT:

API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

WHAT THIS MEANS:
├─ API_URL: Where backend listens
├─ FRONTEND_URL: Where frontend runs
└─ Used for CORS configuration

COMMON VARIATIONS:
- Frontend on port 3000: FRONTEND_URL=http://localhost:3000
- Backend on port 5000: API_URL=http://localhost:5000

IN .env FILE:
API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

---

## 📍 Complete .env File Example

Create this file at: `backend/app/.env`

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/learnbuddy

# ============================================
# GOOGLE CLOUD STORAGE (GCS)
# ============================================
GCS_PROJECT=my-learnbuddy-project-123456
GCS_BUCKET=learnbuddy-pdfs
GCS_CREDENTIALS_JSON=C:\Users\hp\Downloads\learnbuddy-key.json

# ============================================
# GEMINI API (AI Content Generation)
# ============================================
GEMINI_API_KEY=sk-1234567890abcdefghijklmnopqrstuvwxyz
GEMINI_FAST_MODEL=gemini-1.5-flash
GEMINI_PRO_MODEL=gemini-1.5-pro

# ============================================
# JWT TOKEN CONFIGURATION
# ============================================
JWT_SECRET=my-super-secret-jwt-key-that-is-very-long-and-random
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# ============================================
# REDIS QUEUE (Background Tasks)
# ============================================
REDIS_URL=redis://localhost:6379/0

# ============================================
# APPLICATION URLS
# ============================================
API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

---

## 🔄 Step-by-Step: Get All Keys in 10 Minutes

### Step 1: Database (Already Have!) - 1 min
```
✅ MySQL running in XAMPP
✅ You know: root (no password)
Result: DATABASE_URL ready
```

### Step 2: Gemini API - 2 min
```
1. Open: https://ai.google.dev/
2. Click: Get API Key
3. Create project
4. Copy key
Result: GEMINI_API_KEY ready
```

### Step 3: Google Cloud Project - 2 min
```
1. Open: https://console.cloud.google.com/
2. Create new project
3. Copy project ID
Result: GCS_PROJECT ready
```

### Step 4: GCS Bucket - 2 min
```
1. Go to: Storage → Buckets
2. Create bucket
3. Copy bucket name
Result: GCS_BUCKET ready
```

### Step 5: Service Account Key - 2 min
```
1. Go to: IAM & Admin → Service Accounts
2. Create service account
3. Add Storage Admin role
4. Download JSON key
Result: GCS_CREDENTIALS_JSON ready
```

### Step 6: Create .env - 1 min
```
1. Create backend/app/.env
2. Copy template above
3. Paste your values
Result: .env file ready
```

**Total Time: ~10 minutes!**

---

## ✅ Verification Checklist

Before starting backend, verify:

```powershell
# 1. Check .env exists
Test-Path backend\app\.env
# Should show: True

# 2. Check .env has database URL
Select-String "DATABASE_URL" backend\app\.env
# Should show: DATABASE_URL=mysql+...

# 3. Check MySQL is running
mysql -u root -p
# Should connect

# 4. Check Gemini key
Select-String "GEMINI_API_KEY" backend\app\.env
# Should show a key starting with 'sk-'

# 5. Check GCS credentials file exists
Test-Path (cat backend\app\.env | Select-String "GCS_CREDENTIALS_JSON" | %{$_ -match 'GCS_CREDENTIALS_JSON=(.*)'; $matches[1]})
# Should show: True
```

---

## 🚀 Now Start Backend

Once .env is ready:

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r app\requirements.txt
uvicorn app.main:app --reload
```

You should see:
```
✓ Uvicorn running on http://0.0.0.0:8000
✓ Application startup complete
```

---

## 🎉 Test Connection

Open frontend: http://localhost:5173

Try to signup - if it works, you're connected! 🎊

---

**That's it! You now know:**
- What each key is
- Where to get it
- Where to put it
- How to verify it

**Go get your keys and create .env! You've got this! 🚀**
