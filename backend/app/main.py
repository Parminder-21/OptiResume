import logging
import sys
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Allow ai_engine imports from project root
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from app.routes import upload, optimize, download, auth, chat
from app.core.config import settings
from app.db.session import engine, Base
import app.models.user # Ensure models are loaded for create_all

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(name)s — %(message)s"
)
logger = logging.getLogger(__name__)

# Debug: Check if Groq API key is loaded
if not settings.GROQ_API_KEY:
    logger.warning("⚠️  GROQ_API_KEY not found in environment!")
    logger.warning("⚠️  Set GROQ_API_KEY in .env file for resume rewriting to work")
else:
    logger.info("✅ GROQ_API_KEY loaded from environment")


# ─── Startup / Shutdown ───────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Use lightweight TF-IDF mode (no SBERT) to fit within Render 512MB RAM limit."""
    logger.info("Initializing in lightweight mode (TF-IDF) to prevent Out of Memory errors.")
    try:
        # Create database tables
        logger.info("Initializing database...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables initialized")
    except Exception as e:
        logger.error(f"⚠️ Database initialization failed: {e}")

    app.state.sbert_model = None
    yield  # App runs here

    logger.info("Shutting down OptiResume AI...")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="OptiResume AI",
    description="Real-time ATS Simulator & Resume Optimizer",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global Error Handler ─────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "An unexpected error occurred. Please try again."}
    )


# ─── Routes ───────────────────────────────────────────────────────────────────

app.include_router(upload.router,   prefix="/api/v1", tags=["Upload"])
app.include_router(optimize.router, prefix="/api/v1", tags=["Optimize"])
app.include_router(download.router, prefix="/api/v1", tags=["Download"])
app.include_router(auth.router,     prefix="/api/v1", tags=["Auth"])
app.include_router(chat.router,     prefix="/api/v1", tags=["Chat"])


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "model_loaded": getattr(app.state, "sbert_model", None) is not None,
        "version": "1.0.0"
    }