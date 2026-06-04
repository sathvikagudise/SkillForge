# 📖 COMPLETE FRONTEND-BACKEND CONNECTION GUIDE

## 🎯 What You Have

- ✅ **Frontend:** React + TypeScript with Lovable (at `/src`)
- ✅ **Backend:** FastAPI with Celery workers (at `/backend/app`)
- ✅ **Database:** MySQL with SQLAlchemy ORM
- ✅ **Storage:** Google Cloud Storage for PDFs
- ✅ **AI:** Gemini API for content generation
- ✅ **Queue:** Redis + Celery for background tasks

## 📚 Documentation Files Created For You

| File | Purpose | Read Time |
|------|---------|-----------|
| **CHECKLIST.md** | Quick setup checklist (start here!) | 5 min |
| **SETUP_GUIDE.md** | Detailed setup with all commands | 20 min |
| **TESTING_GUIDE.md** | Complete testing & troubleshooting | Reference |
| **DATABASE_GUIDE.md** | Database & Alembic migrations | Reference |
| **README_SETUP.md** | Overview & architecture | 10 min |
| **This file** | Complete reference guide | Reference |

## 🚀 GETTING STARTED (Choose Your Path)

### Path 1: "Just Get It Running" (30 mins)
1. Read **CHECKLIST.md** completely
2. Follow every step in order
3. Run `.\start-all.ps1`
4. Open http://localhost:5173

### Path 2: "I Want to Understand" (1-2 hours)
1. Read **README_SETUP.md** for overview
2. Read **SETUP_GUIDE.md** for details
3. Follow setup steps slowly
4. Test each component individually

### Path 3: "I Know What I'm Doing" (10 mins)
```powershell
Copy-Item backend\app\.env.example backend\app\.env
# Edit .env with your credentials
.\start-all.ps1
```

## 📋 Step-by-Step Summary

### STAGE 1: Preparation (10 mins)

```powershell
# 1. Verify prerequisites
python --version          # Should be 3.11+
node --version           # Should be 16+
mysql -u root -p         # Test MySQL
redis-cli ping           # Test Redis (PONG = success)

# 2. Create .env file
Copy-Item backend\app\.env.example backend\app\.env

# 3. Edit .env with YOUR credentials
# - DATABASE_URL
# - GCS_PROJECT, GCS_BUCKET, GCS_CREDENTIALS_JSON
# - GEMINI_API_KEY
# - JWT_SECRET (any random long string)
```

### STAGE 2: Environment Setup (5 mins)

```powershell
# Create Python virtual environment
python -m venv backend\venv

# Activate it
backend\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend\app\requirements.txt
```

### STAGE 3: Database Setup (5 mins)

```powershell
# Open phpMyAdmin
http://localhost/phpmyadmin

# Create database:
# Name: learnbuddy
# Collation: utf8mb4_unicode_ci
```

### STAGE 4: Start Services (2 mins × 4 services)

**Terminal 1: FastAPI Backend**
```powershell
cd backend
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
# Wait for: "Application startup complete"
```

**Terminal 2: Celery Worker**
```powershell
cd backend
venv\Scripts\Activate.ps1
celery -A app.tasks.celery_app worker --loglevel=info
# Wait for: "celery@... ready."
```

**Terminal 3: Frontend Dev**
```powershell
npm install  # Only first time
npm run dev
# Wait for: "Local: http://localhost:5173/"
```

**Terminal 4: Redis (if not running)**
```powershell
redis-server  # Or use WSL/Docker
# Wait for: "Ready to accept connections"
```

### STAGE 5: Quick Test (2 mins)

```powershell
# Test 1: Health
curl http://localhost:8000/health
# ✅ Response: {"status":"ok"}

# Test 2: Frontend loads
# Open http://localhost:5173 in browser
# ✅ Should see login page

# Test 3: Sign up
# Click "Sign Up", fill form, submit
# ✅ Should redirect to dashboard

# Test 4: Upload
# Click upload, select PDF
# ✅ Should show progress bar
```

## 🏗️ Architecture at a Glance

```
┌─ FRONTEND (React) ────────────────┐
│  - Login/Signup                   │
│  - Upload Page                    │
│  - Dashboard                      │
│  - useAuth Hook (JWT management)  │
└──────────────┬────────────────────┘
               │ HTTP REST API
               ├─ /auth (JWT tokens)
               ├─ /files (upload)
               └─ /api/ai (AI endpoints)
               │
┌──────────────▼────────────────────┐
│ BACKEND (FastAPI) ─────────────── │
│  - JWT Authentication             │
│  - File Management                │
│  - Database (MySQL)               │
│  - Gemini API calls               │
└──────────────┬────────────────────┘
        ┌──────┼──────┐
        │      │      │
    ┌───▼──┐ ┌─▼───┐ │
    │MySQL │ │Redis│ │
    │  DB  │ │ Queue
    └──────┘ └─────┘ │
             ┌────────▼────┐
             │ Celery      │
             │ Worker      │
             │ (Async)     │
             └─────────────┘
             ┌─────────────┐
             │   GCS       │
             │  Storage    │
             │ (PDFs)      │
             └─────────────┘
```

## 🔗 How Frontend Connects to Backend

### 1. Authentication Flow

```typescript
// User signs up
const { signup } = useAuth();
await signup("email@example.com", "password", "name");
// ↓ Calls backend POST /auth/signup
// ↓ Backend creates user in MySQL
// ↓ Frontend stores JWT token in localStorage

// Later, user signs in
const { login } = useAuth();
const { access_token } = await login("email@example.com", "password");
// ↓ Calls backend POST /auth/login
// ↓ Backend verifies password
// ↓ Backend returns JWT token
// ↓ Frontend uses token for all future requests
```

### 2. File Upload Flow

```typescript
// User selects PDF
const { file_id, upload_url } = await filesAPI.presignUpload("file.pdf", userId);
// ↓ Backend returns GCS signed URL

// Upload directly to GCS
await fetch(upload_url, { method: 'PUT', body: file });
// ↓ File stored in Google Cloud

// Trigger processing
await aiAPI.generateNotes(file_id, token);
// ↓ Backend creates background task
// ↓ Celery worker processes PDF
// ↓ Extracts text, creates embeddings, calls Gemini
```

### 3. API Response Flow

```typescript
// Request with auth
const response = await fetch('http://localhost:8000/api/ai/summarize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,  // JWT token
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ file_id: 1, length: 'medium' })
});

// Backend verifies token
// Backend checks user owns file
// Backend calls Gemini API
// Backend returns summary
const { summary } = await response.json();
```

## 📡 API Endpoints Reference

### Auth Endpoints
```
POST   /auth/signup              Create new user
POST   /auth/login               Get JWT token
GET    /auth/me                  Get current user info
```

### File Endpoints
```
POST   /files/presign            Get upload URL for PDF
GET    /files/                   List user's files
GET    /files/{id}               Get file details
POST   /files/{id}/process       Start background processing
DELETE /files/{id}               Delete file
```

### AI Endpoints
```
POST   /api/ai/summarize         Generate summary
POST   /api/ai/flashcards/generate   Create flashcards
POST   /quiz/generate            Generate quiz
POST   /api/ai/notes             Generate notes
GET    /search/notes             Search notes
```

### System Endpoints
```
GET    /health                   Health check
GET    /docs                     API documentation (Swagger)
GET    /redoc                    API documentation (ReDoc)
```

## 🧪 Testing Each Component

### Test 1: Backend is Running
```powershell
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

### Test 2: Database Connection
```powershell
# Check in terminal 1 (FastAPI)
# Should show: "SELECT 1" query executing
# No errors about "Can't connect to MySQL"
```

### Test 3: Authentication
```powershell
# Signup
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234","name":"Test"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'
# Expected: {"access_token": "..."}
```

### Test 4: Frontend to Backend
```powershell
# Check browser DevTools (F12)
# Go to Network tab
# Try to login on frontend
# Should see POST request to http://localhost:8000/auth/login
# Should see 200 OK response
# Should NOT see CORS errors
```

### Test 5: File Upload
```powershell
# From frontend
# Go to dashboard
# Click upload button
# Select PDF
# Should see progress: 0% → 100%
# Should complete successfully
```

## 🔧 Common Configurations

### Change Frontend URL
If running on different port (not 5173):

Edit `backend/app/.env`:
```env
FRONTEND_URL=http://localhost:3000  # or your port
```

### Change Backend URL
If running on different host:

Edit `src/services/api.ts`:
```typescript
const API_URL = 'http://your-server:8000';
```

### Change Database
Edit `backend/app/.env`:
```env
DATABASE_URL=mysql+pymysql://user:password@host:port/dbname
```

### Use Different AI Model
Edit `backend/app/.env`:
```env
GEMINI_FAST_MODEL=gemini-2.0-flash
GEMINI_PRO_MODEL=gemini-2.0-pro
```

## 🆘 Quick Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Can't connect to database" | Check MySQL running, verify DATABASE_URL in .env |
| "CORS error" in browser | Check FRONTEND_URL in .env, restart backend |
| "Redis connection refused" | Start Redis server: `redis-server` |
| "Token invalid" | Make sure JWT_SECRET is set in .env |
| "File upload fails" | Check GCS credentials, verify bucket name |
| "Celery task doesn't run" | Check Redis is running, restart Celery worker |
| "Gemini error" | Check API key, verify key has access |
| Frontend can't find backend | Check both services running, check ports |

**For detailed fixes, see TESTING_GUIDE.md**

## 📊 Performance Tips

1. **Enable caching**
   ```python
   from fastapi_cache2 import FastAPICache2
   # Cache AI responses for 1 hour
   ```

2. **Add rate limiting**
   ```python
   from slowapi import Limiter
   # Limit Gemini API calls to prevent overspending
   ```

3. **Optimize database queries**
   ```python
   # Add indexes on frequently searched columns
   # Use `select_in_load` to avoid N+1 queries
   ```

4. **Use CDN for frontend**
   ```
   Deploy frontend to Vercel/Netlify
   Deploy backend to AWS/GCP/Railway
   ```

## 🚀 Production Deployment

### Before Deploying

- [ ] Test all endpoints locally
- [ ] Update DATABASE_URL to production database
- [ ] Change JWT_SECRET to strong random string
- [ ] Disable `--reload` in FastAPI
- [ ] Use Gunicorn instead of Uvicorn
- [ ] Setup SSL/HTTPS certificates
- [ ] Enable request logging

### Deployment Options

1. **AWS**
   - RDS for database
   - EC2 for backend
   - S3 for file storage
   - CloudFront for CDN

2. **Google Cloud**
   - Cloud SQL for database
   - Cloud Run for backend
   - Cloud Storage (already using)
   - Cloud CDN

3. **Heroku** (easiest)
   ```bash
   git push heroku main
   heroku config:set DATABASE_URL=...
   heroku logs --tail
   ```

4. **Docker**
   ```dockerfile
   FROM python:3.11
   WORKDIR /app
   COPY backend .
   RUN pip install -r requirements.txt
   CMD ["uvicorn", "app.main:app"]
   ```

## 📞 Getting Help

1. **Check error messages** - They're usually helpful!
2. **Check logs** - Each terminal shows what's happening
3. **See TESTING_GUIDE.md** - Has 10+ common issues
4. **Check official docs**
   - FastAPI: https://fastapi.tiangolo.com/
   - React: https://react.dev/
   - SQLAlchemy: https://docs.sqlalchemy.org/

## ✅ Success Criteria

Your setup is complete when:

- ✅ All 4 services running without errors
- ✅ Frontend loads at http://localhost:5173
- ✅ Backend API accessible at http://localhost:8000
- ✅ Can signup and login
- ✅ Can upload and process PDF
- ✅ Celery processes files
- ✅ AI endpoints work
- ✅ No console errors

## 🎉 Next Steps

After basic setup works:

1. **Add features**
   - Knowledge graphs
   - Quiz generation
   - Real-time notifications

2. **Improve performance**
   - Add caching
   - Optimize queries
   - Add pagination

3. **Enhance security**
   - Add rate limiting
   - Implement CSRF protection
   - Add request validation

4. **Deploy to production**
   - Setup CI/CD
   - Configure monitoring
   - Setup backups

## 📖 Quick Reference

```powershell
# Start everything
.\start-all.ps1

# Start FastAPI only
cd backend; venv\Scripts\Activate.ps1; uvicorn app.main:app --reload

# Start Celery only
cd backend; venv\Scripts\Activate.ps1; celery -A app.tasks.celery_app worker

# Start frontend only
npm run dev

# Start Redis
redis-server

# View API docs
http://localhost:8000/docs

# View database
http://localhost/phpmyadmin

# Test endpoints
curl http://localhost:8000/health
```

## 🎓 Learning Resources

- **FastAPI Tutorial** - https://fastapi.tiangolo.com/tutorial/
- **React Fundamentals** - https://react.dev/learn
- **SQLAlchemy Guide** - https://docs.sqlalchemy.org/tutorial/
- **Celery Guide** - https://docs.celeryproject.io/getting-started/
- **Gemini API** - https://ai.google.dev/docs

---

## 💡 Final Tips

1. **Keep .env file safe** - Never commit to git
2. **Test locally before deploying** - Always!
3. **Read error messages carefully** - They guide you
4. **Check logs when stuck** - Always shows what went wrong
5. **Ask for help early** - Don't waste time debugging alone

---

**You're all set! Start with CHECKLIST.md and follow each step. Good luck! 🚀**

Questions? Problems? Check TESTING_GUIDE.md or reach out for help.

Happy coding! 🎓
