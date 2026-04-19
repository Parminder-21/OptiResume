import re
import hashlib


def clean_text(text: str) -> str:
    """Remove excessive horizontal whitespace but PRESERVE newlines."""
    # Only collapse horizontal whitespace (spaces, tabs, etc. NOT newlines)
    text = re.sub(r'[ \t\r\f\v]+', ' ', text)
    # Remove non-printable characters except space and newline
    text = re.sub(r'[^\x20-\x7E\n]', '', text)
    return text.strip()


def truncate_text(text: str, max_chars: int = 8000) -> str:
    """Truncate text to max_chars, keeping complete sentences."""
    if len(text) <= max_chars:
        return text
    truncated = text[:max_chars]
    last_period = truncated.rfind('.')
    if last_period > max_chars * 0.8:
        return truncated[:last_period + 1]
    return truncated


def hash_text(text: str) -> str:
    """SHA256 hash for caching keys."""
    return hashlib.sha256(text.encode()).hexdigest()


def normalize_score(raw: float, min_val: float = 0.2, max_val: float = 0.9, floor: float = 10.0) -> float:
    """
    Normalize cosine similarity [min_val, max_val] → [0, 100].
    Cosine scores between unrelated texts rarely go below 0.2.
    """
    normalized = (raw - min_val) / (max_val - min_val)
    score = max(floor, min(100.0, normalized * 100))
    return round(score, 1)


def extract_bullets(text: str) -> list[str]:
    """
    Aggressively extract bullet-point lines from resume text.
    Handles resumes with no bullet chars (plain PDF extraction),
    section-based content, and wall-of-text documents.
    """
    import logging
    logger = logging.getLogger(__name__)

    lines = text.split('\n')
    bullets = []
    seen = set()

    SECTION_KEYWORDS = [
        'experience', 'skills', 'project', 'achievement',
        'responsibility', 'education', 'summary', 'objective',
        'certification', 'work history', 'employment'
    ]
    BULLET_PATTERN = re.compile(r'^[-•*●◦▪▸►✓✔◆■□▶→\u2022\u2023\u2043]\s+')
    NUMBERED_PATTERN = re.compile(r'^\d+[.):\-]\s+')
    ALL_CAPS_HEADER = re.compile(r'^[A-Z][A-Z\s\/\-]{5,}$')

    in_section = False
    # NOTE: We do NOT reset in_section on blank lines (that was the bug)

    for line in lines:
        stripped = line.strip()

        # Skip empty or very short lines (but DON'T reset in_section)
        if not stripped or len(stripped) < 8:
            continue

        # Detect section headers — set in_section but don't add as bullet
        if any(kw in stripped.lower() for kw in SECTION_KEYWORDS):
            in_section = True
            continue

        # Skip ALL-CAPS headers (e.g., "WORK EXPERIENCE", "EDUCATION")
        if ALL_CAPS_HEADER.match(stripped) and len(stripped) < 50:
            in_section = True
            continue

        # --- Type 1: Traditional bullet characters ---
        if BULLET_PATTERN.match(stripped):
            bullet = BULLET_PATTERN.sub('', stripped).strip()
            if len(bullet) > 10 and bullet not in seen:
                bullets.append(bullet)
                seen.add(bullet)
            continue

        # --- Type 2: Numbered list items ---
        if NUMBERED_PATTERN.match(stripped) and len(stripped) > 15:
            bullet = NUMBERED_PATTERN.sub('', stripped).strip()
            if bullet not in seen:
                bullets.append(bullet)
                seen.add(bullet)
            continue

        # --- Type 3: Content lines inside a detected section ---
        if in_section and 20 < len(stripped) < 300:
            # Skip lines that look like dates, headers, or job titles
            has_date = bool(re.search(r'\b(20\d\d|19\d\d|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', stripped))
            if not has_date and stripped not in seen:
                bullets.append(stripped)
                seen.add(stripped)

    # --- Fallback: if nothing found, grab any medium-length line ---
    if not bullets:
        logger.warning("No bullets found with standard patterns — using aggressive fallback")
        for line in lines:
            stripped = line.strip()
            if 20 < len(stripped) < 300 and not ALL_CAPS_HEADER.match(stripped) and stripped not in seen:
                bullets.append(stripped)
                seen.add(stripped)
                if len(bullets) >= 25:
                    break

    logger.info(f"Extracted {len(bullets)} bullets for Groq optimization")
    return bullets[:25]  # Cap at 25 to stay within token limits


def split_into_sentences(text: str) -> list[str]:
    """Simple sentence splitter for resume text."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 15]


def validate_resume_quality(text: str) -> None:
    """
    Validate if the provided text looks like a professional resume.
    
    Checks:
    1. Minimum character length (300 chars)
    2. Presence of at least 2 standard resume section headers
    
    Raises:
        ValueError: If validation fails with a specific reason.
    """
    cleaned = text.strip()
    
    # 1. Length check
    if len(cleaned) < 300:
        raise ValueError(
            f"The provided content is too short ({len(cleaned)} characters). "
            "A standard resume should be at least 300 characters long."
        )
    
    # 2. Section check
    SECTION_KEYWORDS = [
        'experience', 'skills', 'education', 'project', 'achievement',
        'responsibility', 'summary', 'objective', 'certification', 
        'work history', 'employment', 'technical skills', 'profile'
    ]
    
    text_lower = cleaned.lower()
    found_sections = []
    
    for kw in SECTION_KEYWORDS:
        # Look for the keyword as a potential header (often surrounded by newlines or at start)
        # Using a more robust regex for header detection
        if re.search(rf'(?m)^[ \t]*{re.escape(kw)}[ \t]*[:\-]?$', text_lower, re.IGNORECASE) or \
           re.search(rf'(?m)^[ \t]*[•\-\*●◦▪▸►✓✔◆■□▶→]?[ \t]*{re.escape(kw)}', text_lower, re.IGNORECASE):
            found_sections.append(kw)
    
    # Deduplicate and check count
    unique_sections = set(found_sections)
    
    # Fallback: if no strict headers found, check for general keyword density
    if len(unique_sections) < 2:
        # Check for general presence of the keywords anywhere (more lenient)
        general_matches = [kw for kw in SECTION_KEYWORDS if kw in text_lower]
        if len(set(general_matches)) < 3:
            raise ValueError(
                "This document doesn't look like a professional resume. "
                "It is missing standard sections like 'Experience', 'Education', or 'Skills'. "
                "Please upload a valid resume or paste your full professional details."
            )