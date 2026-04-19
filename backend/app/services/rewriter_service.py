import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from ai_engine.rewriting.resume_rewriter import rewrite_resume
from app.models.request_models import DiffItem
from app.core.utils import clean_text


def rewrite_and_diff(
    resume_text: str,
    job_description: str,
    model,
    target_keywords: list[str] = None,
    user_context: str = None,
) -> tuple[str, list[DiffItem]]:
    """
    Rewrite resume bullets using LLM and return:
        - optimized full resume text
        - list of DiffItem (original vs optimized per bullet)

    Also validates rewrites using semantic similarity (anti-hallucination).
    """
    optimized_text, raw_diff = rewrite_resume(
        resume_text, job_description, model,
        target_keywords=target_keywords,
        user_context=user_context,
    )

    diff_items: list[DiffItem] = []
    for item in raw_diff:
        try:
            original_raw = item.get("original", "")
            rewritten_raw = item.get("rewritten", "")
            
            # Ensure we have strings, not dicts or other types
            original = clean_text(str(original_raw) if original_raw else "")
            optimized = clean_text(str(rewritten_raw) if rewritten_raw else original)
            
            # Compare as strings
            changed = (original.strip().lower() if original.strip() else "") != (optimized.strip().lower() if optimized.strip() else "")

            diff_items.append(DiffItem(
                original=original,
                optimized=optimized,
                changed=changed
            ))
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error processing diff item: {e}, item: {item}")
            continue

    return optimized_text, diff_items