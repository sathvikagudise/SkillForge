# LearnBuddy Backend (FastAPI) — Local Dev Guide

## Prereqs
- Python 3.11+
- XAMPP running MySQL (create database `learnbuddy`)
- Redis running locally (for Celery) -> `redis-server`
- Google Cloud service account JSON for GCS and a bucket created
- Gemini API key (set as GEMINI_API_KEY in .env)

## Setup
1. Copy files into `backend/`
2. Create and edit `.env` from `.env.example`
   - Make sure DATABASE_URL points to your local MySQL (XAMPP)
   - Ensure GCS_CREDENTIALS_JSON points to your service account JSON file
   - Set GEMINI_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
3. Install dependencies
