# 📋 ENV FILE SETUP GUIDE

Your `.env` file is now located at:
```
backend/app/.env
```

This guide shows you EXACTLY what to fill in for each variable.

---

## 🟢 MUST DO FIRST (Required for Login/Signup)

### 1️⃣ DATABASE_URL

**Current Value:**
```env
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/learnbuddy
```

**What it is:** Connection to your XAMPP MySQL database

**How to fill it:**
- If using XAMPP with NO password (default):
  ```env
  DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/learnbuddy
  ```
  
- If using XAMPP with a password:
  ```env
  DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@127.0.0.1:3306/learnbuddy
  ```

**Example:**
```env
DATABASE_URL=mysql+pymysql://root:mypass123@127.0.0.1:3306/learnbuddy
```

**Test it works:**
1. Open http://localhost/phpmyadmin
2. If it opens, you're good!

✅ **Status:** Ready to go!

---

### 2️⃣ JWT_SECRET

**Current Value:**
```env
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-change-in-production
```

**What it is:** Secret key for signing authentication tokens

**How to fill it:**

Just make up a long random string (minimum 32 characters):

**Options:**

Option A - Simple (use this for development):
```env
JWT_SECRET=development-secret-key-you-can-change-later-when-deploying
```

Option B - Using Python (generate a secure one):
```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Then copy the output and paste it in `.env`

Option C - Random string from this website:
Go to: https://www.random.org/strings/
- Length: 32
- Unique: Yes
- Copy the result into `.env`

**Example:**
```env
JWT_SECRET=aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV
```

✅ **Status:** Pick any random 32-character string!

---

### 3️⃣ FRONTEND_URL

**Current Value:**
```env
FRONTEND_URL=http://localhost:5173
```

**What it is:** Where your React frontend is running

**How to fill it:**
- **For local development (what you want):**
  ```env
  FRONTEND_URL=http://localhost:5173
  ```

- **For production:**
  ```env
  FRONTEND_URL=https://yourapp.com
  ```

✅ **Status:** Already correct! Don't change!

---

## 🟡 OPTIONAL (For AI & File Storage Features)

### 4️⃣ GEMINI_API_KEY

**Current Value:**
```env
GEMINI_API_KEY=your-gemini-api-key
```

**What it is:** API key for Google's Gemini AI (for summarization, flashcards, quiz generation)

**How to get it:**

1. Go to: https://ai.google.dev/
2. Click "Get API Key"
3. Sign in with your Google account
4. Create new project (name it "LearnBuddy")
5. Copy your API key
6. Paste into `.env`:

```env
GEMINI_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrstu
```

**If you skip this:**
- ❌ AI features won't work (summarize, flashcards, quiz)
- ✅ But login/signup/notes still work!

**Recommended for now:** Leave as `your-gemini-api-key` and add it later

---

### 5️⃣ GCS_* (Google Cloud Storage)

**Current Values:**
```env
GCS_PROJECT=your-project-id
GCS_BUCKET=your-bucket-name
GCS_CREDENTIALS_JSON=C:/Users/hp/gcp/key.json
GOOGLE_APPLICATION_CREDENTIALS=C:/Users/hp/gcp/key.json
```

**What it is:** Cloud storage for file uploads (Google Cloud Storage)

**How to get it:**
1. Go to: https://console.cloud.google.com/
2. Create new project
3. Enable Cloud Storage API
4. Create a storage bucket
5. Create a service account and download JSON key
6. Save JSON to: `C:/Users/hp/gcp/key.json`
7. Fill values from JSON file

**If you skip this:**
- ❌ File uploads won't work
- ✅ But login/signup still work!

**Recommended for now:** Leave as is and add it later

---

### 6️⃣ GOOGLE_CLIENT_* (OAuth Login)

**Current Values:**
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**What it is:** Allows users to sign in with Google account

**If you skip this:**
- ❌ Google sign-in won't work
- ✅ But email/password login still works!

**Recommended for now:** Leave as is and add it later

---

## 🔴 ALREADY SET (Don't Change)

```env
# These are fine as-is:
GEMINI_FAST_MODEL=gemini-1.5-flash
GEMINI_PRO_MODEL=gemini-1.5-pro
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=${REDIS_URL}
CELERY_RESULT_BACKEND=${REDIS_URL}
API_URL=http://localhost:8000
```

---

## ✅ YOUR MINIMUM .env (Just for Login/Signup)

Copy this and paste into your `backend/app/.env`:

```env
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/learnbuddy
JWT_SECRET=development-secret-key-you-can-change-later-when-deploying
FRONTEND_URL=http://localhost:5173
GEMINI_FAST_MODEL=gemini-1.5-flash
GEMINI_PRO_MODEL=gemini-1.5-pro
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
API_URL=http://localhost:8000
GEMINI_API_KEY=your-gemini-api-key
GCS_PROJECT=your-project-id
GCS_BUCKET=your-bucket-name
GCS_CREDENTIALS_JSON=C:/Users/hp/gcp/key.json
GOOGLE_APPLICATION_CREDENTIALS=C:/Users/hp/gcp/key.json
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## 🎯 WHAT TO DO NOW

### Step 1: Check DATABASE_URL
```
1. Open http://localhost/phpmyadmin
2. If it loads → Your XAMPP MySQL is running ✅
3. If not → Start XAMPP MySQL first
```

### Step 2: Update JWT_SECRET
```
1. Open backend/app/.env
2. Replace JWT_SECRET value with any random 32-char string
3. Save file
```

### Step 3: Keep everything else as-is
```
✅ FRONTEND_URL = http://localhost:5173 (correct)
✅ API_URL = http://localhost:8000 (correct)
✅ Other values = will work for now
```

### Step 4: Done!
```
Your .env is ready for:
✅ Login
✅ Signup
✅ User database
✅ Authentication tokens
```

---

## ⚡ NEXT STEPS

After you verify .env works:

1. **Start Backend:**
   ```powershell
   cd backend
   venv\Scripts\Activate.ps1
   uvicorn app.main:app --reload
   ```

2. **Start Frontend:**
   ```powershell
   npm run dev
   ```

3. **Test Signup:**
   - Go to http://localhost:5173
   - Click "Sign Up"
   - Fill in email, password, name
   - Click "Sign Up"
   - Should redirect to dashboard ✅

---

## 🆘 Troubleshooting

### "Can't connect to database"
**Solution:**
1. Start XAMPP
2. Create database "learnbuddy" in phpmyadmin
3. Restart backend

### "Token error" when signing up
**Solution:**
1. Check JWT_SECRET is not empty
2. Make it at least 32 characters
3. Restart backend

### "CORS error" in browser
**Solution:**
1. Make sure FRONTEND_URL = http://localhost:5173
2. Restart backend
3. Reload browser (Ctrl+F5)

### ".env not found"
**Solution:**
1. Make sure file is at: `backend/app/.env`
2. Use `.env` (not `.env.example` or `.env.txt`)
3. Restart backend

---

## 📚 Learn More About Each Key

| Key | Purpose | Required? | Where to Get |
|-----|---------|-----------|--------------|
| DATABASE_URL | MySQL connection | ✅ YES | XAMPP local MySQL |
| JWT_SECRET | Auth token signing | ✅ YES | Any random string |
| FRONTEND_URL | Frontend URL | ✅ YES | http://localhost:5173 |
| GEMINI_API_KEY | AI summaries | ❌ NO | https://ai.google.dev/ |
| GCS_* | Cloud file storage | ❌ NO | Google Cloud Console |
| GOOGLE_CLIENT_* | Google login | ❌ NO | Google Cloud Console |
| REDIS_URL | Background jobs | ✅ YES* | localhost:6379 |
| API_URL | Backend URL | ✅ YES | http://localhost:8000 |

*Redis needed for background tasks, but not for basic login/signup

---

## 🎉 You're Ready!

Your `.env` file is configured for:
- ✅ User signup/login
- ✅ User data storage
- ✅ JWT authentication
- ✅ Frontend-backend connection

**Time to test!** See NEXT STEPS above.
