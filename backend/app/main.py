from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from .config import settings
from .routes import auth, files, ai, user, notes, flashcards, quiz, email
from .routes import knowledge
from .routes import search, pdf, plagiarism, summarize, learning_path, calendar, knowledge_graph
from .config import settings
from .db import Base, engine
import os
import traceback
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("backend")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="LearnBuddy Backend")

FRONTEND_URLS = os.getenv("FRONTEND_URL", "http://localhost:8080")
origins = [u.strip() for u in FRONTEND_URLS.split(",") if u.strip()]

for maybe in ["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:8081", "http://127.0.0.1:8081", "http://localhost:3000", "http://127.0.0.1:3000"]:
    if maybe not in origins:
        origins.append(maybe)

print("CORS allowed origins:", origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Range"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.SESSION_SECRET)

@app.middleware("http")
async def log_request_and_response(request: Request, call_next):
    try:
        origin = request.headers.get("origin")
        auth = request.headers.get("authorization")
        masked_auth = None
        if auth and isinstance(auth, str):
            if len(auth) > 20:
                masked_auth = auth[:12] + "..." + auth[-8:]
            else:
                masked_auth = auth
        logger.info(f"Incoming request: {request.method} {request.url.path} Origin={origin} Auth={masked_auth}")
    except Exception as e:
        logger.exception("Failed to log request headers")

    try:
        response = await call_next(request)
    except Exception as e:
        logger.exception(f"Request failed with exception: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

    try:
        aca = response.headers.get("access-control-allow-origin")
        logger.info(f"Response status={response.status_code} Access-Control-Allow-Origin={aca}")
    except Exception as e:
        logger.exception("Failed to log response headers")

    return response

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create database tables on startup: {e}")
    print("Database operations will fail until the database is properly configured and running.")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/auth", tags=["user"])
app.include_router(files.router, prefix="/files", tags=["files"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(notes.router, prefix="/notes", tags=["notes"])
app.include_router(flashcards.router, prefix="/flashcards", tags=["flashcards"])
app.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
app.include_router(quiz.router, prefix="/quizzes", tags=["quiz"])
app.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
app.include_router(email.router, prefix="/email", tags=["email"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(pdf.router, prefix="/pdf", tags=["pdf"])
app.include_router(plagiarism.router, prefix="/plagiarism", tags=["plagiarism"])
app.include_router(summarize.router, prefix="/summarize", tags=["summarize"])
app.include_router(learning_path.router, prefix="/learning-path", tags=["learning_path"])
app.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
app.include_router(knowledge_graph.router, prefix="/knowledge-graph", tags=["knowledge_graph"])

@app.get("/health")
def health():
    return {"status": "ok"}

@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    tb = traceback.format_exc()
    print("Unhandled exception:\n", tb)
    return JSONResponse(status_code=500, content={"error": str(exc), "trace": tb})
