# 🏃 START NOW: Connect Frontend to Backend (5 Minutes)

**You don't need everything perfect. Let's just get it working!**

---

## ⏱️ 5-MINUTE QUICK START

### ✅ Step 1: Create .env File (2 min)

**Open PowerShell:**
```powershell
notepad backend\app\.env
```

**Copy and paste this:**
```env
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/learnbuddy
JWT_SECRET=my-development-secret-key-change-in-production-12345678
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:8000
```

**Save and close**

---

### ✅ Step 2: Create MySQL Database (1 min)

**Open browser:**
```
http://localhost/phpmyadmin
```

**Create database:**
1. Click "New" on left side
2. Database name: `learnbuddy`
3. Collation: `utf8mb4_unicode_ci`
4. Click "Create"

---

### ✅ Step 3: Start Backend (1 min)

**Open PowerShell in workspace root:**
```powershell
cd backend

# Create virtual environment (first time only)
python -m venv venv

# Activate it
venv\Scripts\Activate.ps1

# Install packages (first time only)
pip install -r app\requirements.txt

# Start backend
uvicorn app.main:app --reload
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

---

### ✅ Step 4: Start Frontend (1 min)

**Open new PowerShell window:**
```powershell
npm run dev
```

**You should see:**
```
  VITE v5.4.19  ready in 123 ms
  ➜  Local:   http://localhost:5173/
```

---

### ✅ Step 5: Test (Usually works!)

**Open browser:**
```
http://localhost:5173
```

**You should see:**
- Login page
- "Sign Up" button

**Click "Sign Up":**
1. Enter: Email (e.g., test@example.com)
2. Enter: Password (e.g., Test1234!)
3. Enter: Name (e.g., Test User)
4. Click: "Sign Up"

**Result:**
- ✅ If it works → You're connected! 🎉
- ❌ If it fails → Check error message below

---

## 🐛 If Something Breaks

### Error: "Can't connect to database"
```
Problem: MySQL not running or wrong URL
Solution: 
1. Start XAMPP MySQL
2. Wait 5 seconds
3. Restart backend (Ctrl+C, then start again)
```

### Error: "CORS error" in browser console
```
Problem: FRONTEND_URL wrong
Solution:
1. Check backend/app/.env
2. Make sure: FRONTEND_URL=http://localhost:5173
3. Restart backend
```

### Error: "Invalid JWT secret"
```
Problem: JWT_SECRET missing or blank
Solution:
1. Check backend/app/.env
2. Make sure: JWT_SECRET=your-secret-string
3. Restart backend
```

### Error: "Database doesn't exist"
```
Problem: learnbuddy database not created
Solution:
1. Open: http://localhost/phpmyadmin
2. Create new database
3. Name: learnbuddy
4. Collation: utf8mb4_unicode_ci
5. Create
6. Restart backend
```

---

## 🎉 When It Works

**You'll see this flow:**

1. Frontend loads: http://localhost:5173 ✅
2. Click "Sign Up"
3. Enter email/password
4. Click "Sign Up" button
5. Success message appears
6. Redirected to dashboard
7. See your email on screen ✅

---

## 📊 What's Happening Behind the Scenes

```
Frontend (React):
  ↓ You click "Sign Up"
  ↓ Calls: api.ts → authAPI.signup()
  ↓ Sends HTTP POST to backend
  ↓ 
Backend (FastAPI):
  ↓ Receives POST request at /auth/signup
  ↓ Validates email/password
  ↓ Hashes password
  ↓ Creates user in MySQL database
  ↓ Returns user info + JWT token
  ↓ 
Frontend:
  ↓ Receives response
  ↓ Stores JWT token in localStorage
  ↓ Shows success message
  ↓ Redirects to dashboard ✅
```

---

## 🔑 Keys You Added

**In backend/app/.env:**
```
✅ DATABASE_URL    → MySQL connection
✅ JWT_SECRET      → Token signing
✅ FRONTEND_URL    → CORS config
✅ API_URL         → Backend address
```

**All other keys are optional!** You can add them later:
- GEMINI_API_KEY (for AI)
- GCS_* (for cloud storage)
- REDIS_URL (for background jobs)

---

## ✨ Next Steps

### If Everything Works:
1. ✅ Test signup/login
2. ✅ Try uploading a file
3. ✅ Check database in phpMyAdmin
4. ✅ Read TESTING_GUIDE.md to understand more

### If You Want More Features:
1. Get GEMINI_API_KEY from https://ai.google.dev/
2. Add to .env
3. Restart backend
4. Now you can generate summaries!

### If You Want Cloud Storage:
1. Setup Google Cloud (see KEYS_VISUAL_MAP.md)
2. Add GCS_* keys to .env
3. Restart backend
4. Now files upload to cloud!

---

## 🚀 You're Done!

Your frontend and backend are now connected!

**What you have:**
✅ Frontend at http://localhost:5173
✅ Backend at http://localhost:8000
✅ Database ready (MySQL)
✅ Authentication working
✅ Ready to test and develop

**What's next:**
→ Test all features
→ Add more keys as needed
→ Build your app
→ Deploy when ready

---

## 💡 Pro Tips

1. **Terminal windows**: Keep both (frontend & backend) running
2. **Changes**: Restart both if you modify code
3. **Database**: Check http://localhost/phpmyadmin to see data
4. **Logs**: Check terminal output for errors
5. **Console**: Open browser DevTools (F12) to see API calls

---

## 📞 Common Issues Quick Fixes

| Issue | Fix |
|-------|-----|
| Port 8000 already in use | Kill process or use different port |
| MySQL not running | Start XAMPP |
| Can't find Python | Restart terminal |
| Module not found | Run: `pip install -r app\requirements.txt` |
| venv not working | Delete `venv` folder and create new |

---

## ✅ Success Checklist

- [x] Created .env file with 4 keys
- [x] Created MySQL database
- [x] Started backend (port 8000)
- [x] Started frontend (port 5173)
- [x] Tested signup/login
- [x] Frontend and backend connected!

---

**You did it! 🎉**

Your application is now running with frontend and backend connected!

Go test it at: **http://localhost:5173**

---

**Questions? Check:**
- QUICK_KEYS_GUIDE.md - How to get keys
- KEYS_VISUAL_MAP.md - What each key does
- TESTING_GUIDE.md - Troubleshooting
- Terminal logs - Error messages

**Good luck! 🚀**
