"""Module for rewriting resume content using LLM (Groq API)."""

import os
import re
import sys
import json
import logging
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from groq import Groq
from app.core.config import settings
from app.core.utils import extract_bullets

logger = logging.getLogger(__name__)

# Bullet prefixes to detect and preserve
_BULLET_PATTERN = re.compile(r'^([\s]*)([•\-\*●◦▪▸►✓✔◆■□▶→\d]+[.):]?\s+)(.*)')


def load_rewrite_prompt() -> str:
    """Load the rewrite prompt template."""
    prompt_path = os.path.join(
        os.path.dirname(__file__),
        '..', 'prompts', 'rewrite_prompt.txt'
    )
    if os.path.exists(prompt_path):
        with open(prompt_path, 'r') as f:
            return f.read()

    # Fallback prompt
    return (
        "You are an expert ATS resume optimizer.\n"
        "Rewrite each bullet to better match the job description using relevant keywords.\n"
        "Keep factual accuracy. Return ONLY a JSON array: "
        '[{"original": "...", "rewritten": "..."}]'
    )


def _extract_json_from_response(text: str) -> list:
    """
    Robustly extract a JSON array from LLM response text.
    Handles markdown code blocks, extra prose, nested JSON objects, etc.
    """
    # Strip markdown code fences
    text = re.sub(r'```(?:json)?', '', text).strip()

    # Try to find the outermost JSON array
    bracket_start = text.find('[')
    if bracket_start != -1:
        # Find the matching closing bracket
        depth = 0
        for i, ch in enumerate(text[bracket_start:], bracket_start):
            if ch == '[':
                depth += 1
            elif ch == ']':
                depth -= 1
                if depth == 0:
                    json_str = text[bracket_start:i+1]
                    try:
                        parsed = json.loads(json_str)
                        if isinstance(parsed, list):
                            return parsed
                    except json.JSONDecodeError:
                        break

    # Try to find a JSON object with rewritten_bullets key
    obj_start = text.find('{')
    if obj_start != -1:
        depth = 0
        for i, ch in enumerate(text[obj_start:], obj_start):
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    json_str = text[obj_start:i+1]
                    try:
                        parsed = json.loads(json_str)
                        if isinstance(parsed, dict):
                            return parsed.get('rewritten_bullets', [])
                    except json.JSONDecodeError:
                        break

    raise ValueError(f"Could not extract JSON array from response:\n{text[:500]}")


def _replace_bullet_in_text(full_text: str, original_bullet: str, rewritten_bullet: str) -> tuple[str, bool]:
    """
    Flexibly find and replace a bullet in full resume text.
    Handles -, •, *, ●, ◦, ▪ prefixes or plain text.
    Returns (new_text, was_replaced).
    """
    # Escape original for regex
    escaped = re.escape(original_bullet.strip())

    # Try replacing with any common bullet prefix
    pattern = re.compile(
        r'(?m)^([ \t]*[•\-\*●◦▪▸►✓✔◆■□▶→][ \t]+)' + escaped + r'[ \t]*$'
    )
    match = pattern.search(full_text)
    if match:
        prefix = match.group(1)
        new_text = full_text[:match.start()] + prefix + rewritten_bullet + full_text[match.end():]
        return new_text, True

    # Try numbered bullets  (e.g. "1. ", "2) ")
    pattern_num = re.compile(
        r'(?m)^([ \t]*\d+[.):][ \t]+)' + escaped + r'[ \t]*$'
    )
    match = pattern_num.search(full_text)
    if match:
        prefix = match.group(1)
        new_text = full_text[:match.start()] + prefix + rewritten_bullet + full_text[match.end():]
        return new_text, True

    # Try plain direct replacement (no bullet prefix)
    if original_bullet.strip() in full_text:
        new_text = full_text.replace(original_bullet.strip(), rewritten_bullet.strip(), 1)
        return new_text, True

    # Fuzzy: try matching first 60 chars to handle minor whitespace differences
    short = original_bullet.strip()[:60]
    if len(short) > 20:
        idx = full_text.find(short)
        if idx != -1:
            # Find end of line
            end_idx = full_text.find('\n', idx)
            if end_idx == -1:
                end_idx = len(full_text)
            line = full_text[idx:end_idx]
            new_text = full_text[:idx] + rewritten_bullet.strip() + full_text[end_idx:]
            return new_text, True

    return full_text, False


def rewrite_resume(resume_text: str, job_description: str, model, target_keywords: list[str] = None) -> tuple[str, list[dict]]:
    """
    Rewrite resume bullets using Groq API to match job description.

    Args:
        resume_text: Original resume text
        job_description: Target job description
        model: SBERT model (unused but kept for interface compatibility)
        target_keywords: Optional list of top keywords to prioritize

    Returns:
        Tuple of (optimized_full_text, list_of_diffs)
        where each diff is {"original": str, "rewritten": str}
    """
    # Validate API key
    api_key = settings.GROQ_API_KEY
    if not api_key or api_key.strip() == "" or "gsk_" not in api_key:
        logger.error(f"❌ GROQ_API_KEY is invalid or missing! Got: {repr(api_key[:20]) if api_key else 'EMPTY'}")
        bullets = extract_bullets(resume_text)
        return resume_text, [{"original": b, "rewritten": b} for b in bullets]

    logger.info(f"✅ Using Groq API key: {api_key[:20]}...")

    # Initialize Groq client
    try:
        import httpx
        # STRATEGY: Explicitly passing an httpx.Client with proxies={} 
        # stops the library from trying to auto-detect and pass 'proxies'
        # which causes the crash on Render.
        client = Groq(
            api_key=api_key,
            http_client=httpx.Client(proxies={})
        )
    except Exception as e:
        logger.error(f"❌ Failed to initialize Groq client: {e}")
        bullets = extract_bullets(resume_text)
        return resume_text, [{"original": b, "rewritten": b} for b in bullets]

    # Extract bullets from resume
    bullets = extract_bullets(resume_text)
    
    # NEW: If extract_bullets still fails, treat paragraphs as bullets so AI always runs
    if not bullets and len(resume_text) > 100:
        logger.warning("⚠️ No formatted bullets found. Splitting by double-newlines as fallback.")
        bullets = [p.strip() for p in resume_text.split('\n\n') if 30 < len(p.strip()) < 500][:15]
    
    logger.info(f"[EXTRACT] Found {len(bullets)} bullets for optimization")

    if not bullets:
        logger.warning("[EXTRACT] No bullets found - returning unchanged")
        return resume_text, []

    # Load rewrite prompt
    system_prompt = load_rewrite_prompt()

    # Build user message — send bullets as a numbered list for clarity
    bullets_text = "\n".join(f"{i+1}. {b}" for i, b in enumerate(bullets[:20]))
    
    keywords_str = ""
    if target_keywords:
        keywords_str = f"\nTARGET KEYWORDS TO INCORPORATE:\n{', '.join(target_keywords)}\n"

    user_message = (
        f"Job Description:\n{job_description[:3000]}\n"
        f"{keywords_str}"
        f"\nResume Bullets to Optimize ({min(len(bullets), 20)} bullets):\n"
        f"{bullets_text}\n\n"
        "Rewrite every bullet to incorporate relevant keywords from the job description. "
        "Always improve — do NOT leave bullets unchanged unless truly impossible.\n"
        "Return ONLY a valid JSON array with no markdown fences:\n"
        '[{"original": "exact original text", "rewritten": "improved text"}, ...]'
    )

    try:
        logger.info(f"[GROQ] Calling Groq API with {settings.MODEL_NAME}...")
        response = client.chat.completions.create(
            model=settings.MODEL_NAME,
            max_tokens=settings.MAX_TOKENS,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message}
            ],
            temperature=0.4  # Lower temperature = more consistent, keyword-accurate output
        )

        response_text = response.choices[0].message.content
        logger.info(f"[GROQ] Response length: {len(response_text)} chars")
        logger.info(f"[GROQ] Response preview: {response_text[:300]}")

        # Parse JSON robustly
        rewritten = _extract_json_from_response(response_text)
        logger.info(f"✅ Parsed {len(rewritten)} rewritten bullets from Groq")

    except Exception as e:
        logger.error(f"[ERROR] Groq API / JSON parse failed: {e}", exc_info=True)
        return resume_text, [{"original": b, "rewritten": b} for b in bullets]

    # Build diff list and reconstruct optimized text
    optimized_text = resume_text
    diff_list = []
    replacements_made = 0

    for i, original_bullet in enumerate(bullets[:20]):
        # Get corresponding rewritten item
        if i < len(rewritten):
            item = rewritten[i]
            if isinstance(item, dict):
                # Match by "original" field first, then by index
                rewritten_text = item.get("rewritten") or item.get("optimized") or original_bullet
                # Validate it's a string
                if not isinstance(rewritten_text, str):
                    rewritten_text = str(rewritten_text)
            elif isinstance(item, str):
                rewritten_text = item
            else:
                rewritten_text = original_bullet
        else:
            rewritten_text = original_bullet

        rewritten_text = rewritten_text.strip()

        # Replace in full text if the bullet actually changed
        if rewritten_text and rewritten_text.lower() != original_bullet.strip().lower():
            optimized_text, replaced = _replace_bullet_in_text(
                optimized_text, original_bullet, rewritten_text
            )
            if replaced:
                replacements_made += 1
                logger.debug(f"✓ Replaced [{i}]: '{original_bullet[:50]}' → '{rewritten_text[:50]}'")
            else:
                logger.warning(f"⚠ Could not locate bullet [{i}] in text: '{original_bullet[:50]}'")

        diff_list.append({
            "original": original_bullet.strip(),
            "rewritten": rewritten_text
        })

    logger.info(f"✅ Replacement summary: {replacements_made}/{len(diff_list)} bullets updated in text")

    if replacements_made == 0 and len(bullets) > 0:
        logger.warning("⚠ Zero replacements made! Optimized text is identical to original.")

    return optimized_text, diff_list
