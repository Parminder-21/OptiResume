"""Chat route — generates pre-optimization context questions."""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.services.chat_service import generate_questions
from app.routes.auth import get_current_user
from app.models.user import User as UserModel
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatQuestionsRequest(BaseModel):
    resume_text: str
    job_description: str


class ChatQuestion(BaseModel):
    id: str
    question: str
    options: Optional[list[str]] = []
    hint: Optional[str] = ""


class ChatQuestionsResponse(BaseModel):
    status: str = "success"
    questions: list[ChatQuestion]


@router.post("/chat/questions", response_model=ChatQuestionsResponse)
async def get_chat_questions(
    data: ChatQuestionsRequest,
    current_user: UserModel = Depends(get_current_user),
):
    """
    Generate targeted pre-optimization questions based on resume + JD gap analysis.
    Called after the user uploads resume and pastes JD, before optimization starts.
    """
    if not data.resume_text.strip() or not data.job_description.strip():
        raise HTTPException(status_code=400, detail="Resume text and job description are required.")

    try:
        logger.info("[CHAT] Generating pre-optimization questions...")
        questions = generate_questions(data.resume_text, data.job_description)
        logger.info(f"[CHAT] Generated {len(questions)} questions")
        return ChatQuestionsResponse(questions=[ChatQuestion(**q) for q in questions])
    except Exception as e:
        logger.error(f"[CHAT] Failed to generate questions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate questions. Please try again.")
