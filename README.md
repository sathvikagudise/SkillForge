# 🚀 SkillForge

> AI-powered personalized learning platform that transforms study materials into interactive flashcards, quizzes, knowledge graphs, and optimized learning paths.

---

## 📌 Overview

SkillForge is a full-stack web application designed to help students and lifelong learners study more effectively. Upload your PDF study materials and let AI generate smart flashcards with spaced repetition, custom quizzes, visual knowledge graphs, and adaptive learning paths — all powered by local AI (Ollama) or cloud APIs (DeepSeek/Gemini).

---

## ✨ Features

- User Authentication (email/password + Google OAuth)
- PDF Upload & AI-Powered Text Processing
- Smart Flashcards with SM-2 Spaced Repetition Algorithm
- AI-Generated Quizzes
- Interactive Knowledge Graph Visualization
- Adaptive Learning Paths
- Study Calendar & Schedule Planning
- Full-Text Search Across Notes & Documents

---

## 🛠️ Tech Stack

### Frontend
- React.js (TypeScript)
- Vite
- Tailwind CSS
- shadcn/ui Components

### Backend
- Python (FastAPI)
- SQLAlchemy ORM
- MySQL Database
- FAISS Vector Search

### AI Providers
- Ollama (local, primary)
- DeepSeek API (cloud, fallback)
- Gemini API (cloud, fallback)

---

## 📂 Folder Structure

```bash
SkillForge/
│
├── backend/
│   └── app/
│       ├── routes/          # API endpoints
│       ├── schemas/         # Pydantic models
│       ├── services/        # Business logic + AI adapters
│       ├── utils/           # Auth, JWT, storage helpers
│       └── .env             # Configuration
│
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/               # Route pages
│   ├── services/            # API client
│   ├── hooks/               # Custom React hooks
│   └── snippets/            # Utility functions
│
├── package.json
├── README.md
└── .gitignore
```

---

## ⚙️ Installation Guide

### 1️⃣ Prerequisites

- Node.js & npm
- Python 3.10+
- MySQL (XAMPP or standalone)
- Ollama (optional, for local AI)

### 2️⃣ Clone the Repository

```bash
git clone https://github.com/sathvikagudise/SkillForge.git
```

### 3️⃣ Navigate to Project Directory

```bash
cd SkillForge
```

### 4️⃣ Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
pip install -r app/requirements.txt
```

Configure `backend/app/.env` with your database and API keys.

Start MySQL, then create tables:

```bash
python create_tables.py
```

### 5️⃣ Frontend Setup

```bash
npm install
```

### 6️⃣ Start Development Servers

**Backend:**

```bash
cd backend
python run.py
```

**Frontend (new terminal):**

```bash
npm run dev
```

Open **http://localhost:8080** in your browser.

---

## 🌐 Environment Variables

Create `backend/app/.env` and configure:

```env
DATABASE_URL=mysql+pymysql://root@127.0.0.1:3306/learnbuddy

# AI Providers (at least one)
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=phi3:mini

DEEPSEEK_API_KEY=your_key
GEMINI_API_KEY=your_key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# App URLs
API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:8080
```

---

## 🚀 Deployment

### Build Frontend for Production

```bash
npm run build
```

Output is in the `dist/` folder — serve with any static host (Vercel, Netlify, etc.).

---

## 📖 API Documentation

Once the backend is running, visit:

```
http://localhost:8000/docs
```

for interactive Swagger API documentation.

---

## 🤝 Contributing

Contributions are welcome.

### Steps to Contribute

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Added new feature"
```

4. Push to GitHub

```bash
git push origin feature-name
```

5. Create a Pull Request

---

## 🔒 Security

- JWT Authentication
- Password Hashing (bcrypt)
- Protected API Routes
- OAuth 2.0 (Google)

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

### Sathvika Yadav

- GitHub: https://github.com/sathvikagudise
- LinkedIn: https://linkedin.com/in/sathvikayadav
- Email: sathvikayadav3@gmail.com

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub.
