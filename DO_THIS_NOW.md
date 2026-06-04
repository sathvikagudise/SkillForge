# 🎯 EXACTLY WHAT TO DO RIGHT NOW

**Stop reading. Do this in order. 5 minutes to connection!**

---

## RIGHT NOW - OPEN 2 POWERSHELL WINDOWS

### WINDOW 1: Backend

```powershell
# Go to workspace
cd c:\Users\hp\Desktop\cmlp-portal-main

# Go to backend
cd backend

# Create environment (only first time)
python -m venv venv

# Activate environment
venv\Scripts\Activate.ps1

# Install packages (only first time - takes 2-3 minutes)
pip install -r app\requirements.txt

# Start backend
uvicorn app.main:app --reload
```

**Wait until you see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**Leave this running!**

---

### WINDOW 2: Frontend

```powershell
# Go to workspace
cd c:\Users\hp\Desktop\cmlp-portal-main

# Start frontend dev server
npm run dev
```

**Wait until you see:**
```
  ➜  Local:   http://localhost:5173/
```

**Leave this running!**

---

## OPEN BROWSER: CREATE .env FILE

**While services are starting, create the config file:**

### Open Notepad

```powershell
# In any new window, just type:
notepad backend\app\.env
```

### Paste This:

```env
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/learnbuddy
JWT_SECRET=development-key-change-in-production-12345678901234567890
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:8000
REDIS_URL=redis://localhost:6379/0
GEMINI_FAST_MODEL=gemini-1.5-flash
GEMINI_PRO_MODEL=gemini-1.5-pro
```

### Save File (Ctrl+S) and Close

---

## SETUP MYSQL DATABASE

### Open Browser

```
http://localhost/phpmyadmin
```

### Create Database

1. Click "New" on left side
2. Enter: `learnbuddy`
3. Collation: `utf8mb4_unicode_ci`
4. Click "Create"

**Done!** Tables will auto-create when backend starts.

---

## TEST CONNECTION

### Open Browser

```
http://localhost:5173
```

### You Should See

- Login page with "Sign Up" button

### Try This

1. Click "Sign Up"
2. Fill form:
   - Email: `test@example.com`
   - Password: `Test1234!`
   - Name: `Test User`
3. Click "Sign Up" button

### Result

✅ **Success!**
- Redirected to dashboard
- See "Hello Test User!"
- You're connected!

❌ **Error?**
- Check terminal for error message
- See troubleshooting section below

---

## 🐛 QUICK FIXES (If Something Fails)

### Backend Won't Start

```powershell
# Check if venv activated (should see (venv) in prompt)
# If not:
venv\Scripts\Activate.ps1

# Install packages again
pip install -r app\requirements.txt

# Try again
uvicorn app.main:app --reload
```

### "Can't connect to database"

```
1. Check: http://localhost/phpmyadmin loads
2. If not: Start XAMPP MySQL
3. Wait 5 seconds
4. Restart backend (Ctrl+C, then start again)
```

### Frontend Won't Load

```
1. Check: Terminal says "Local: http://localhost:5173/"
2. If not: Kill old Node process
3. Try: npm run dev again
```

### CORS Error in Browser

```
1. Edit: backend\app\.env
2. Make sure: FRONTEND_URL=http://localhost:5173
3. Restart backend
4. Reload browser (F5)
```

### "Module not found" error

```
cd backend
pip install -r app\requirements.txt
# Then restart backend
```

---

## 📊 You Should Now Have

```
✅ Two terminal windows running
   - Terminal 1: FastAPI backend running on port 8000
   - Terminal 2: React frontend running on port 5173

✅ One browser window open
   - http://localhost:5173

✅ One database created
   - MySQL database "learnbuddy"

✅ One config file created
   - backend/app/.env with 4 required keys

✅ One working connection
   - Frontend can call backend
   - Backend can access database
```

---

## 🎯 Next: Test More Features

### Test Login

1. Click "Logout" (if you see it)
2. Click "Sign In"
3. Enter: test@example.com / Test1234!
4. Click "Sign In"
5. Should see dashboard again ✅

### Test Upload (If Available)

1. Look for "Upload" button
2. Select a PDF file
3. Click upload
4. Should show progress and success ✅

### Check Database

1. Open: http://localhost/phpmyadmin
2. Click: learnbuddy database
3. Click: user table
4. Should see: Your test user ✅

---

## 🎉 YOU'RE DONE!

Your frontend is now connected to your backend!

**What you have working:**
- ✅ Signup with email/password
- ✅ Login with credentials
- ✅ User data stored in database
- ✅ JWT authentication tokens
- ✅ Full frontend-backend integration

**What you can add later:**
- Gemini API key (for AI features)
- Google Cloud credentials (for cloud storage)
- Redis setup (for background jobs)

---

## 📚 Learn More

If you want to understand what's happening:

- **QUICK_KEYS_GUIDE.md** - What each key does
- **KEYS_VISUAL_MAP.md** - Where to get keys
- **TESTING_GUIDE.md** - Troubleshooting
- **COMPLETE_REFERENCE.md** - Full technical guide

---

## 💡 Keep Terminals Open!

**Important:** Keep both frontend and backend terminals running while you develop!

```
Terminal 1 (Backend):  Keep running → http://localhost:8000
Terminal 2 (Frontend): Keep running → http://localhost:5173
Browser:              Open and refresh as needed
```

---

## ✨ Common Next Steps

### Add AI Features (5 minutes)
1. Get GEMINI_API_KEY from https://ai.google.dev/
2. Add to .env: `GEMINI_API_KEY=sk-...`
3. Restart backend
4. Now summarization works!

### Add Cloud Storage (15 minutes)
1. Setup Google Cloud Storage
2. Add GCS keys to .env
3. Restart backend
4. Now uploads go to cloud!

### Deploy to Production (varies)
1. Push to GitHub
2. Deploy on Heroku/Railway/AWS
3. Update URLs
4. Going live!

---

## 🚀 YOU'RE READY!

Stop reading. Start testing!

**Open:** http://localhost:5173

**Try signing up!**

If it works, you're connected! 🎉

If not, check the error in the backend terminal and see troubleshooting section above.

---

**Good luck! You've got this! 💪**

Need help? All documentation files are in your workspace!
