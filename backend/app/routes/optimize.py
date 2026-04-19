from fastapi import APIRouter, HTTPException, Request, Depends
from app.models.request_models import OptimizeRequest, OptimizeResponse, ScorePair
from app.services import scoring_service, skill_gap_service, rewriter_service
from app.core.utils import validate_resume_quality
import logging

router  = APIRouter()
logger  = logging.getLogger(__name__)


from app.routes.auth import get_current_user
from app.models.user import User as UserModel

@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_resume(
    data: OptimizeRequest, 
    request: Request,
    current_user: UserModel = Depends(get_current_user)
):
    """
    Core pipeline endpoint.

    Steps:
        0. Validate content quality
        1. Score original resume vs JD
        2. Detect skill gaps
        3. Rewrite bullets with LLM (Groq)
        4. Re-score optimized resume
        5. Build diff
        6. Return full response
    """
    # NEW: Validate pasted content quality
    validate_resume_quality(data.resume_text)
    
    model = request.app.state.sbert_model
    
    logger.info(f"📋 Starting optimization pipeline")
    logger.info(f"Resume length: {len(data.resume_text)} chars")
    logger.info(f"JD length: {len(data.job_description)} chars")

    try:
        # ── Step 1: Score original ────────────────────────────────────────────
        logger.info("1️⃣ Computing initial ATS score...")
        initial_scores = scoring_service.compute_scores(
            data.resume_text,
            data.job_description,
            model
        )
        logger.info(f"✅ Initial scores: {initial_scores.overall}% overall")

        # ── Step 2: Detect skill gaps ─────────────────────────────────────────
        logger.info("2️⃣ Detecting skill gaps...")
        skill_gaps = skill_gap_service.detect_gaps(
            data.resume_text,
            data.job_description
        )
        logger.info(f"✅ Found {len(skill_gaps)} skill gaps")

        # ── Step 3: Rewrite resume with LLM ───────────────────────────────────
        logger.info("3️⃣ Rewriting resume with AI (Groq LLM)...")
        # Pass missing keywords for targeted optimization
        target_keywords = initial_scores.missing_keywords[:15] # Focus on top 15
        
        optimized_text, diff_items = rewriter_service.rewrite_and_diff(
            data.resume_text,
            data.job_description,
            model,
            target_keywords=target_keywords
        )
        logger.info(f"✅ Rewriting complete. {len(diff_items)} diffs generated")
        logger.info(f"   Original length: {len(data.resume_text)} chars → Optimized: {len(optimized_text)} chars")
        if diff_items:
            logger.info(f"   Sample diff: '{diff_items[0].original[:50]}' → '{diff_items[0].optimized[:50]}'")

        # ── Step 4: Re-score optimized resume ─────────────────────────────────
        logger.info("4️⃣ Computing optimized ATS score...")
        optimized_scores = scoring_service.compute_scores(
            optimized_text,
            data.job_description,
            model
        )
        logger.info(f"✅ Optimized scores: {optimized_scores.overall}% overall")
        logger.info(f"   Improvement: {optimized_scores.overall - initial_scores.overall:+.1f}%")

        # ── Step 5: Build response ─────────────────────────────────────────────
        logger.info("5️⃣ Building response...")
        response = OptimizeResponse(
            status="success",
            scores=ScorePair(
                initial=initial_scores,
                optimized=optimized_scores
            ),
            skill_gaps=skill_gaps,
            optimized_resume=optimized_text,
            diff=diff_items
        )

        logger.info(
            f"✅ Optimization complete! {initial_scores.overall}% → {optimized_scores.overall}% "
            f"({optimized_scores.overall - initial_scores.overall:+.1f}%)"
        )
        return response

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Optimization failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Optimization failed: {str(e)}. Please try again."
        )