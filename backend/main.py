from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from routes.auth import router as auth_router
from routes.courses import router as courses_router
from routes.documents import router as documents_router
from routes.chat import router as chat_router

settings = get_settings()

app = FastAPI(
    title="AI Course Assistant API",
    description="RAG-based course assistant chatbot API",
    version="1.0.0",
)

# CORS — allow frontend origins
allowed_origins = [o.strip().rstrip('/') for o in settings.cors_origins.split(",") if o.strip()]
if "https://ai-course-assistant-architecture.vercel.app" not in allowed_origins:
    allowed_origins.append("https://ai-course-assistant-architecture.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(courses_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for monitoring and deployment verification."""
    return {"status": "ok"}


@app.get("/api/v1", tags=["System"])
async def api_root():
    """API root — confirms the API is running."""
    return {"message": "AI Course Assistant API v1"}

