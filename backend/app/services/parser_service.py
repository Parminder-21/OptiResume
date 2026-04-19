import sys
import os

# Allow importing ai_engine from project root
# From backend/app/services/ → go up 3 dirs to backend/ → then up 1 to resume-checker- root
backend_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
project_root = os.path.dirname(backend_root)
sys.path.insert(0, project_root)

from ai_engine.pdf.pdf_parser import parse_pdf_file
from ai_engine.extraction.section_detector import detect_sections
from app.core.utils import clean_text, truncate_text, validate_resume_quality
from app.core.config import settings


def process_uploaded_pdf(file_path: str) -> dict:
    """
    Parse uploaded PDF and return structured resume data.

    Returns:
        {
            raw_text: str,
            sections_detected: list[str],
            char_count: int
        }
    """
    raw_text = parse_pdf_file(file_path)

    if not raw_text:
        raise ValueError(
            "Could not extract any text from this PDF. "
            "Please ensure it is not a scanned or image-based PDF."
        )

    cleaned = clean_text(raw_text)
    
    # NEW: Strict Resume Validation
    validate_resume_quality(cleaned)
    
    truncated = truncate_text(cleaned, settings.MAX_RESUME_CHARS)

    sections = detect_sections(truncated)
    sections_detected = [k for k, v in sections.items() if v.strip()]

    return {
        "raw_text": truncated,
        "sections_detected": sections_detected,
        "char_count": len(truncated)
    }