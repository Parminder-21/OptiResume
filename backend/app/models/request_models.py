from pydantic import BaseModel, field_validator
from typing import Literal, Optional


# ─── Request Models ───────────────────────────────────────────────────────────

class OptimizeRequest(BaseModel):
    resume_text: str
    job_description: str
    user_context: Optional[str] = None  # Answers from pre-optimization chatbot

    @field_validator('resume_text', 'job_description')
    @classmethod
    def must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        if len(v.strip()) < 50:
            raise ValueError("Text is too short to be valid")
        return v.strip()


class DownloadRequest(BaseModel):
    optimized_resume: str
    candidate_name: Optional[str] = "Candidate"


# ─── Response Models ──────────────────────────────────────────────────────────

class ScoreBreakdown(BaseModel):
    overall: float
    skills_match: float
    experience_match: float
    keyword_coverage: float
    formatting: str = "ATS Safe"
    matched_keywords: list[str] = []
    missing_keywords: list[str] = []
    keyword_matched_count: int = 0
    keyword_total_count: int = 0


class ScorePair(BaseModel):
    initial: ScoreBreakdown
    optimized: ScoreBreakdown


class SkillGap(BaseModel):
    skill: str
    priority: Literal["High", "Medium", "Low"]


class DiffItem(BaseModel):
    original: str
    optimized: str
    changed: bool


class OptimizeResponse(BaseModel):
    status: str = "success"
    scores: ScorePair
    skill_gaps: list[SkillGap]
    optimized_resume: str
    diff: list[DiffItem]


class UploadResponse(BaseModel):
    status: str = "success"
    resume_text: str
    char_count: int
    sections_detected: list[str]


class ErrorResponse(BaseModel):
    status: str = "error"
    message: str
    detail: Optional[str] = None


# ─── Auth Models ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True