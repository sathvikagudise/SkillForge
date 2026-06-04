# 🔑 QUICK GUIDE: Connect Frontend to Backend + Where to Get Keys

You're already connected in UI! Now you need the **backend running** and the **keys configured**.

---

## 📍 KEYS YOU NEED (3 Types)

### Type 1: Local Keys (You control these)
These you create - not from external services.

**JWT_SECRET** - Any random string you make up
```
Example: "my-super-secret-key-minimum-32-characters-long-abcdefgh"
Usage: backend/app/.env
```

**DATABASE_URL** - Your MySQL connection
```
Example: mysql+pymysql://root:password@127.0.0.1:3306/learnbuddy
Usage: backend/app/.env
Breakdown:
  - root = MySQL username (default in XAMPP)
  - password = Your MySQL password (often blank in XAMPP)
  - 127.0.0.1 = localhost
  - 3306 = MySQL port
  - learnbuddy = database name
```

---

### Type 2: External API Keys (Free from Google)

#### **GEMINI_API_KEY** - AI API
Where to get:
1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Create new project (or use existing)
4. Copy the API key
5. Paste in backend/app/.env

```env
GEMINI_API_KEY=sk-1234567890abcdefghijklmnop
```

#### **Google Cloud Storage** (GCS) - File Storage
Where to get:
1. Go to https://console.cloud.google.com/
2. Create new project (e.g., "learnbuddy")
3. Go to Storage → Buckets
4. Create new bucket
5. Name: `learnbuddy-storage` (or any name)
6. Region: `us-central1`
7. Create service account:
   - Go to IAM & Admin → Service Accounts
   - Create new service account
   - Name: `learnbuddy-app`
   - Add role: `Storage Admin`
   - Create key: JSON format
   - Download JSON file

```env
GCS_PROJECT=my-project-id-123456
GCS_BUCKET=learnbuddy-storage
GCS_CREDENTIALS_JSON=/full/path/to/downloaded/file.json
```

---

### Type 3: Your URLs (Local Development)

These are automatic - just use these values:

```env
API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
# or http://localhost:5173 if using Vite
```

---

## 🚀 QUICK SETUP (5 Minutes)

### Step 1: Create `.env` File
**Location:** `backend/app/.env`

```powershell
# Navigate to backend
cd backend/app

# Create new file
notepad .env
```

### Step 2: Copy This Template

```env
# ===== DATABASE =====
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/learnbuddy

# ===== GOOGLE CLOUD =====
GCS_PROJECT=your-project-id-here
GCS_BUCKET=your-bucket-name-here
GCS_CREDENTIALS_JSON=C:\Users\YourName\Downloads\learnbuddy-key.json

# ===== GEMINI API =====
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_FAST_MODEL=gemini-1.5-flash
GEMINI_PRO_MODEL=gemini-1.5-pro

# ===== JWT TOKEN =====
JWT_SECRET=make-this-any-long-random-string-minimum-32-chars-aaaaaaaa
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# ===== REDIS QUEUE =====
REDIS_URL=redis://localhost:6379/0

# ===== URLS =====
API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

### Step 3: Fill in Your Values

Replace these with YOUR actual values:

1. **DATABASE_URL**
   - If XAMPP password is blank: `mysql+pymysql://root:@127.0.0.1:3306/learnbuddy`
   - If XAMPP has password: `mysql+pymysql://root:yourpassword@127.0.0.1:3306/learnbuddy`

2. **GCS_PROJECT**
   - Your Google Cloud project ID (from console)

3. **GCS_BUCKET**
   - Your bucket name from Google Cloud Storage

4. **GCS_CREDENTIALS_JSON**
   - Full path to the JSON file you downloaded
   - Example: `C:\Users\hp\Downloads\learnbuddy-key.json`

5. **GEMINI_API_KEY**
   - Your API key from https://ai.google.dev/

6. **JWT_SECRET**
   - Any random string (for now, during development)

### Step 4: Save File

Close notepad and save.

---

## ✅ VERIFY KEYS ARE SET

**Check if .env file exists:**
```powershell
Test-Path backend\app\.env
# Should show: True
```

**Check it has content:**
```powershell
cat backend\app\.env | head -10
# Should show your values
```

---

## 🎯 WHERE EACH KEY IS USED IN CODE

### In Your Frontend
The frontend **doesn't need** any keys directly!

All API calls go through your `src/services/api.ts`:
```typescript
const API_URL = 'http://localhost:8000';
// This connects to your backend (which has all the keys)
```

### In Your Backend
All keys are in `backend/app/config.py`:
```python
class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL")  # ← From .env
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # ← From .env
    # ... etc
```

---

## 🚀 NEXT: Start Everything

Once .env is created with your keys:

### Terminal 1: Start FastAPI Backend
```powershell
cd backend
python -m venv venv  # Only first time
venv\Scripts\Activate.ps1
pip install -r app\requirements.txt  # Only first time
uvicorn app.main:app --reload
```

### Terminal 2: Start Frontend
```powershell
npm run dev
```

### Terminal 3: Start Celery Worker (optional for now)
```powershell
cd backend
venv\Scripts\Activate.ps1
celery -A app.tasks.celery_app worker --loglevel=info
```

### Terminal 4: Start Redis (optional for now)
```powershell
redis-server
# or use WSL/Docker
```

---

## 🧪 TEST CONNECTION (Simple!)

**Open frontend:** http://localhost:5173

**Try to signup:**
```
1. Click "Sign Up"
2. Fill: Email, Password, Name
3. Click "Sign Up" button
```

### What Should Happen

✅ **Success:**
- Page shows a message
- You get logged in
- Redirected to dashboard

❌ **Error:**
- Check backend terminal for error
- Usually it's a key problem or missing database

---

## 🔧 If You Get Errors

### Error: "Can't connect to database"
**Fix:** 
```env
# Check this is correct:
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/learnbuddy

# And MySQL is running (XAMPP Control Panel)
```

### Error: "Invalid API key" (Gemini)
**Fix:**
```env
# Get a fresh key from:
https://ai.google.dev/

# Make sure you copy the whole key, no spaces
GEMINI_API_KEY=sk-your-full-key-here
```

### Error: "GCS authentication failed"
**Fix:**
```env
# Make sure the JSON file path is correct:
GCS_CREDENTIALS_JSON=C:\full\path\to\file.json

# Make sure file exists:
Test-Path C:\your\path\to\file.json
# Should show: True
```

### Error: "CORS error" in frontend
**Fix:**
```env
# Make sure this matches where frontend runs:
FRONTEND_URL=http://localhost:5173
# or
FRONTEND_URL=http://localhost:3000

# Then restart backend
```

---

## 📝 Summary: 3 Simple Steps

### 1️⃣ Get Your Keys
- ✅ Database: Already have (XAMPP)
- ✅ Gemini API: Get from https://ai.google.dev/
- ✅ GCS + JSON: Get from Google Cloud Console
- ✅ JWT Secret: Make one up

### 2️⃣ Create backend/app/.env
```
Copy the template above
Fill in your values
Save file
```

### 3️⃣ Start Backend
```powershell
cd backend
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

### 4️⃣ Start Frontend
```powershell
npm run dev
```

### 5️⃣ Test
```
Open: http://localhost:5173
Try: Signup
Result: Should work!
```

---

## 📊 Key Summary Table

| Key | Where | How to Get | Example |
|-----|-------|-----------|---------|
| DATABASE_URL | .env | Your MySQL | `mysql+pymysql://root:@127.0.0.1:3306/learnbuddy` |
| GCS_PROJECT | .env | Google Cloud | `my-project-12345` |
| GCS_BUCKET | .env | Google Cloud Storage | `learnbuddy-storage` |
| GCS_CREDENTIALS_JSON | .env | Service Account JSON | `/path/to/file.json` |
| GEMINI_API_KEY | .env | https://ai.google.dev/ | `sk-abc123...` |
| JWT_SECRET | .env | Make it up | `my-secret-string-32chars` |
| FRONTEND_URL | .env | Your frontend port | `http://localhost:5173` |
| API_URL | .env | Your backend port | `http://localhost:8000` |

---

## ✨ You're Almost There!

1. Get your keys (5 mins)
2. Create .env file (2 mins)
3. Start backend (1 min)
4. Start frontend (1 min)
5. Test (1 min)

**Total: ~10 minutes to have everything connected!**

---

## 🎉 When It Works

You'll see:

**Frontend (http://localhost:5173):**
```
✓ Login page loads
✓ Sign up form visible
✓ Can type email/password
✓ Can click Sign Up button
✓ Get confirmation message
✓ Logged in!
```

**Backend Terminal:**
```
✓ "Application startup complete"
✓ POST /auth/signup request logged
✓ User created in database
```

---

**That's it! You're connected! Now go get those keys and set up .env! 🚀**

Questions? Check the error messages in the terminal - they usually tell you exactly what's wrong!
