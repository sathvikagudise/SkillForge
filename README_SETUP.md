# LearnBuddy - Complete Frontend-Backend Setup Guide

Welcome! You've built a React frontend with Lovable and a FastAPI backend. This guide will help you **connect them together, test everything, and get it running locally**.

## 🎯 Quick Start (5 minutes)

**If you just want to get it running immediately:**

```powershell
# 1. Copy .env example and fill with your credentials
Copy-Item backend\app\.env.example backend\app\.env
# (Edit backend/app/.env with your API keys and database info)

# 2. Run the automated setup script
.\start-all.ps1

# 3. Open in browser
# Frontend:  http://localhost:5173
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

## 📚 Complete Documentation

This project includes comprehensive guides:

### 1. **CHECKLIST.md** ← START HERE
Quick checklist with all immediate actions. Takes ~30 minutes to complete.

**Contains:**
- Prerequisites verification
- Step-by-step setup instructions
- Testing checklist
- Common issues and fixes

### 2. **SETUP_GUIDE.md** - Detailed Reference
In-depth guide with explanations and examples for each step.

**Contains:**
- Full setup walkthrough
- All curl commands for testing
- Frontend component examples
- Architecture overview
- Next steps and improvements

### 3. **TESTING_GUIDE.md** - Troubleshooting
Comprehensive testing guide with solutions for common problems.

**Contains:**
- Phase-by-phase testing
- 10+ common issues with solutions
- Debug checklist
- "Nuclear option" for resets

## 🏗️ Architecture Overview

```
┌─────────────────────────────────┐
│   Frontend (React/TypeScript)   │
│   - Login/Signup pages          │
│   - Dashboard                   │
│   - File upload                 │
│   - View results                │
└──────────────┬──────────────────┘
               │ HTTP REST API
               ↓
┌─────────────────────────────────┐
│   Backend (FastAPI)             │
│   - Authentication (JWT)        │
│   - File management             │
│   - API endpoints               │
│   - Database (MySQL)            │
└──────────────┬──────────────────┘
               │
    ┌──────────┼──────────┐
    ↓          ↓          ↓
┌────────┐ ┌────────┐ ┌──────────┐
│ MySQL  │ │ Redis  │ │ GCS/S3   │
│Database│ │ Queue  │ │ Storage  │
└────────┘ └────────┘ └──────────┘
               ↓
         ┌─────────────┐
         │ Celery      │
         │ Worker      │
         │ (Background │
         │  Tasks)     │
         └─────────────┘
```

## 📦 What's Included

```
├── backend/
│   ├── app/
│   │   ├── .env.example          # Template for environment variables
│   │   ├── .env                  # YOUR credentials (create this)
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Configuration loader
│   │   ├── models.py            # Database models
│   │   ├── db.py                # Database connection
│   │   ├── routes/              # API endpoints
│   │   ├── schemas/             # Request/response models
│   │   ├── services/            # Business logic
│   │   ├── tasks/               # Celery background tasks
│   │   └── utils/               # Utilities
│   └── requirements.txt          # Python dependencies
│
├── src/
│   ├── hooks/
│   │   └── useAuth.ts           # NEW: Authentication hook
│   ├── services/
│   │   └── api.ts               # NEW: API client layer
│   ├── components/
│   │   └── FileUpload.tsx        # NEW: Upload component
│   └── pages/
│       ├── Login.tsx             # Updated: Connect to backend
│       └── Signup.tsx            # Updated: Connect to backend
│
├── CHECKLIST.md                 # ← Start here (30 mins)
├── SETUP_GUIDE.md               # Detailed walkthrough
├── TESTING_GUIDE.md             # Testing & troubleshooting
├── start-all.ps1                # Automated start script
└── README.md                    # This file
```

## ⚡ Prerequisites

Before starting, make sure you have:

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **XAMPP** (MySQL running) - [Download](https://www.apachefriends.org/)
- **Redis** - [Windows version](https://github.com/microsoftarchive/redis/releases)
- **Google Cloud credentials** (GCS bucket + service account JSON)
- **Gemini API key** - [Get key](https://ai.google.dev/)

## 🚀 Quick Setup Steps

1. **Read CHECKLIST.md** (5-10 minutes to understand)

2. **Create `.env` file**
   ```powershell
   Copy-Item backend\app\.env.example backend\app\.env
   # Then edit it with your credentials
   ```

3. **Setup Python environment**
   ```powershell
   python -m venv backend\venv
   backend\venv\Scripts\Activate.ps1
   pip install -r backend\app\requirements.txt
   ```

4. **Start all services**
   ```powershell
   .\start-all.ps1
   # Or start manually in 4 different terminals:
   # Terminal 1: uvicorn app.main:app --reload
   # Terminal 2: celery -A app.tasks.celery_app worker --loglevel=info
   # Terminal 3: npm run dev
   # Terminal 4: redis-server (or use WSL/Docker)
   ```

5. **Open in browser**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 🧪 Testing

**Quick verification:**

```powershell
# In a PowerShell window:

# 1. Health check
curl http://localhost:8000/health
# Expected: {"status":"ok"}

# 2. Signup
curl -X POST http://localhost:8000/auth/signup `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"test1234","name":"Test"}'

# 3. Login and get token
$loginResponse = curl -X POST http://localhost:8000/auth/login `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"test1234"}'

# 4. Save token
$token = ($loginResponse | ConvertFrom-Json).access_token

# 5. Test protected endpoint
curl http://localhost:8000/files/ `
  -Headers @{"Authorization"="Bearer $token"}
```

For **complete testing guide**, see **TESTING_GUIDE.md**

## 🔧 Environment Setup

**Create `backend/app/.env`** with your credentials:

```env
# Database
DATABASE_URL=mysql+pymysql://root:password@127.0.0.1:3306/learnbuddy

# Google Cloud
GCS_PROJECT=your-gcp-project-id
GCS_BUCKET=your-bucket-name
GCS_CREDENTIALS_JSON=/path/to/gcp-creds.json

# Gemini AI
GEMINI_API_KEY=your-key-here
GEMINI_FAST_MODEL=gemini-1.5-flash
GEMINI_PRO_MODEL=gemini-1.5-pro

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Services
REDIS_URL=redis://localhost:6379/0
API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

**All values are required!** See **SETUP_GUIDE.md** for where to get each one.

## 🎨 Frontend Integration

New files created for you:

- **`src/hooks/useAuth.ts`** - Authentication hook for signup/login
- **`src/services/api.ts`** - API client for all backend endpoints
- **`src/components/FileUpload.tsx`** - File upload component

Updated files to connect to backend:

- **`src/pages/Login.tsx`** - Now uses backend authentication
- **`src/pages/Signup.tsx`** - Now creates user in backend

### Usage Example

```typescript
import { useAuth } from '@/hooks/useAuth';
import { aiAPI } from '@/services/api';

function MyComponent() {
  const { user, token, login, logout } = useAuth();

  const handleSummarize = async (fileId: number) => {
    const result = await aiAPI.summarize(fileId, 'medium', token);
    console.log(result.summary);
  };

  return (
    <div>
      {user && <p>Hello {user.name}!</p>}
      <button onClick={() => handleSummarize(1)}>Summarize</button>
    </div>
  );
}
```

## 📱 Key Endpoints

### Authentication
```
POST   /auth/signup              # Create account
POST   /auth/login               # Get JWT token
GET    /auth/me                  # Get current user
```

### Files
```
POST   /files/presign            # Get upload URL
POST   /files/{id}/process       # Trigger processing
GET    /files/                   # List user files
GET    /files/{id}               # Get file details
```

### AI Features
```
POST   /api/ai/summarize         # Generate summary
POST   /api/ai/flashcards/generate  # Create flashcards
POST   /quiz/generate            # Create quiz
POST   /api/ai/notes             # Generate notes
GET    /search/notes             # Search notes
```

Full API documentation at: http://localhost:8000/docs

## 🐛 Troubleshooting

**For detailed troubleshooting**, see **TESTING_GUIDE.md**

**Quick fixes:**

| Problem | Solution |
|---------|----------|
| Database error | Check MySQL is running, verify DATABASE_URL in .env |
| Redis error | Start Redis: `redis-server` or WSL |
| CORS error | Check FRONTEND_URL in .env matches your frontend URL |
| Auth error | Verify JWT_SECRET is set, check token format |
| File upload error | Check GCS credentials and bucket name |
| Celery not running | Verify Redis is running, start Celery worker |

## 📞 Support & Debugging

1. **Check logs** - Each terminal shows errors
2. **Read TESTING_GUIDE.md** - Has 10+ solutions
3. **Verify .env** - Most issues are credential-related
4. **Check ports** - Make sure 8000, 3000/5173, 6379 are free
5. **Restart services** - Sometimes helps!

## 🎓 What's Next?

After basic setup works:

1. **Add more features** - Knowledge graphs, quizzes, etc.
2. **Improve UI** - Loading states, error handling, animations
3. **Scale database** - Optimize queries, add indexes
4. **Deploy** - AWS/GCP/Heroku with Docker
5. **Monitor** - Add logging, error tracking, analytics

## 📖 Useful Links

- **FastAPI Docs** - https://fastapi.tiangolo.com/
- **React Docs** - https://react.dev/
- **SQLAlchemy** - https://docs.sqlalchemy.org/
- **Celery** - https://docs.celeryproject.io/
- **Gemini API** - https://ai.google.dev/

## 📄 Project Structure Explanation

```
backend/app/
├── main.py                 # App initialization, CORS, routes
├── config.py              # Load environment variables
├── db.py                  # SQLAlchemy setup
├── models.py              # Database tables (User, UserFile, etc)
├── routes/
│   ├── auth.py           # Login, signup endpoints
│   ├── files.py          # Upload, processing endpoints
│   └── ai.py             # Summarize, flashcards endpoints
├── services/
│   ├── embeddings_service.py    # Vector embeddings (FAISS)
│   ├── gemini_service.py        # Gemini API calls
│   └── pdf_processor.py         # PDF extraction
├── tasks/
│   ├── celery_app.py           # Celery configuration
│   ├── pdf_tasks.py            # Background PDF processing
│   └── worker.py               # Celery worker entry
└── utils/
    ├── auth_dep.py             # JWT dependency
    ├── gcs.py                  # Google Cloud Storage
    └── security.py             # Password hashing
```

## ✅ Verification Checklist

Before declaring success:

- [ ] All 4 services running (FastAPI, Celery, Frontend, Redis)
- [ ] http://localhost:8000/health returns OK
- [ ] Can signup and login on frontend
- [ ] Can upload PDF file
- [ ] File appears in database
- [ ] Celery processes file (check logs)
- [ ] Can call AI endpoints
- [ ] No errors in browser console or terminal

## 🎉 You're Ready!

Once all checks pass, you have a fully functional learning platform:

✅ User authentication with JWT
✅ File upload to cloud storage
✅ Background PDF processing
✅ AI-powered content generation
✅ Modern React frontend
✅ Scalable FastAPI backend

**Start with CHECKLIST.md and follow each step. You've got this!** 🚀

---

**Questions?** Check the documentation files or add your errors to a GitHub issue.

**Need help?** Check TESTING_GUIDE.md for solutions to common problems.

**Happy coding!** 🎓
