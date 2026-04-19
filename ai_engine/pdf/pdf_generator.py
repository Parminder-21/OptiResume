"""
Professional PDF generator for optimized resumes.
Uses ReportLab on all platforms (Render/Linux safe).
Produces ATS-safe, single-column, professionally formatted output.
"""

import os
import re
import logging

from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    HRFlowable, Table, TableStyle, KeepTogether,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.lib import colors

logger = logging.getLogger(__name__)

# ─── Colour palette ────────────────────────────────────────────────────────────
NAVY        = colors.HexColor('#1B2A4A')
ACCENT      = colors.HexColor('#2563EB')
DARK        = colors.HexColor('#1F2937')
MID         = colors.HexColor('#4B5563')
LIGHT       = colors.HexColor('#9CA3AF')
RULE_GREY   = colors.HexColor('#D1D5DB')

# ─── Section header keywords ───────────────────────────────────────────────────
SECTION_KEYWORDS = {
    'EXPERIENCE', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE', 'EMPLOYMENT',
    'EDUCATION', 'ACADEMIC BACKGROUND',
    'SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'KEY SKILLS',
    'PROJECTS', 'PERSONAL PROJECTS', 'NOTABLE PROJECTS',
    'SUMMARY', 'PROFESSIONAL SUMMARY', 'CAREER SUMMARY', 'OBJECTIVE',
    'CERTIFICATIONS', 'CERTIFICATIONS & TRAINING', 'LICENSES',
    'ACHIEVEMENTS', 'AWARDS', 'HONORS',
    'LANGUAGES', 'INTERESTS', 'VOLUNTEER', 'PUBLICATIONS', 'RESEARCH',
    'EXTRA-CURRICULAR', 'EXTRACURRICULAR', 'ACTIVITIES',
}

# ─── Regex helpers ─────────────────────────────────────────────────────────────
EMAIL_RE    = re.compile(r'[\w.\-+]+@[\w.\-]+\.\w{2,}')
PHONE_RE    = re.compile(r'(\+?\d[\d\s\-(). ]{6,}\d)')
URL_RE      = re.compile(r'(linkedin\.com/\S+|github\.com/\S+|https?://\S+)', re.I)
DATE_RE     = re.compile(
    r'('
    r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,\']*\d{4}'
    r'|'
    r'\d{4}\s*[-\u2013]\s*(\d{4}|Present|present|Current|current|Till\s*date|Now)'
    r'|'
    r'\d{4}\s*[-\u2013]\s*\d{4}'
    r')',
    re.I,
)
BULLET_RE   = re.compile(r'^[\s]*[-\u2022\u2023\u2043\u2219\u25aa\u25cf*\u2713\u2714\u2023\u25b8\u25b6\u2192]+\s+')


def _xml(text: str) -> str:
    """Sanitize text for ReportLab XML — replace special chars."""
    if not isinstance(text, str):
        text = str(text)
    # Unicode replacements first
    text = (text
        .replace('\u2022', '-').replace('\u2023', '-').replace('\u2043', '-')
        .replace('\u2013', '-').replace('\u2014', '--')
        .replace('\u2018', "'").replace('\u2019', "'")
        .replace('\u201c', '"').replace('\u201d', '"')
        .replace('\u2026', '...').replace('\u00a0', ' ')
        .replace('\u25aa', '-').replace('\u25cf', '-')
        .replace('\u2219', '-').replace('\u25b8', '-')
        .replace('\u25b6', '-').replace('\u2192', '-')
        .replace('\u2713', 'v').replace('\u2714', 'v')
    )
    # XML-escape
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    # Strip non-ASCII
    text = text.encode('ascii', 'ignore').decode('ascii').strip()
    return text


def _is_section(line: str) -> bool:
    upper = line.strip().upper().rstrip(':').strip()
    return upper in SECTION_KEYWORDS


def _is_contact(line: str) -> bool:
    return bool(EMAIL_RE.search(line) or PHONE_RE.search(line) or URL_RE.search(line))


def _is_date(line: str) -> bool:
    return bool(DATE_RE.search(line))


def _is_bullet(line: str) -> bool:
    return bool(BULLET_RE.match(line.strip()))


def _strip_bullet(line: str) -> str:
    return BULLET_RE.sub('', line.strip()).strip()


def _extract_contact_tokens(line: str) -> list[str]:
    """Return list of contact tokens from a line."""
    tokens = []
    for m in EMAIL_RE.finditer(line):
        tokens.append(m.group())
    for m in PHONE_RE.finditer(line):
        tokens.append(m.group().strip())
    for m in URL_RE.finditer(line):
        tokens.append(m.group().strip())
    # Also take plain text that isn't a known pattern (e.g. "New Delhi, India")
    cleaned = EMAIL_RE.sub('', line)
    cleaned = PHONE_RE.sub('', cleaned)
    cleaned = URL_RE.sub('', cleaned)
    cleaned = cleaned.strip(' |,/')
    if len(cleaned) > 3:
        tokens.append(cleaned)
    return [t for t in tokens if t]


def _build_styles() -> dict:
    return {
        'name': ParagraphStyle(
            'name', fontSize=22, fontName='Helvetica-Bold',
            textColor=NAVY, alignment=TA_CENTER,
            spaceBefore=0, spaceAfter=4, leading=26,
        ),
        'contact': ParagraphStyle(
            'contact', fontSize=9, fontName='Helvetica',
            textColor=MID, alignment=TA_CENTER,
            spaceBefore=0, spaceAfter=6, leading=13,
        ),
        'section': ParagraphStyle(
            'section', fontSize=10.5, fontName='Helvetica-Bold',
            textColor=ACCENT, spaceBefore=14, spaceAfter=2, leading=14,
        ),
        'job_title': ParagraphStyle(
            'job_title', fontSize=10.5, fontName='Helvetica-Bold',
            textColor=DARK, spaceBefore=6, spaceAfter=1, leading=14,
        ),
        'company': ParagraphStyle(
            'company', fontSize=9.5, fontName='Helvetica-Oblique',
            textColor=MID, spaceBefore=0, spaceAfter=2, leading=13,
        ),
        'date': ParagraphStyle(
            'date', fontSize=9, fontName='Helvetica-Oblique',
            textColor=LIGHT, alignment=TA_RIGHT, leading=13,
        ),
        'body': ParagraphStyle(
            'body', fontSize=9.5, fontName='Helvetica',
            textColor=DARK, spaceAfter=3, leading=14,
        ),
        'bullet': ParagraphStyle(
            'bullet', fontSize=9.5, fontName='Helvetica',
            textColor=DARK, leftIndent=14, firstLineIndent=0,
            spaceAfter=2, leading=13,
        ),
        'skills': ParagraphStyle(
            'skills', fontSize=9.5, fontName='Helvetica',
            textColor=DARK, spaceAfter=3, leading=14,
        ),
    }


def _extract_name_and_contacts(lines: list[str]) -> tuple[str, list[str]]:
    """
    Scan the top of the resume (first 10 lines) to find:
    - Candidate name (first non-empty, non-contact line)
    - All contact tokens
    """
    name = ""
    contact_tokens = []
    name_found = False

    for line in lines[:10]:
        stripped = line.strip()
        if not stripped:
            continue

        if _is_contact(stripped):
            contact_tokens.extend(_extract_contact_tokens(stripped))
        elif not name_found:
            # First meaningful non-contact line = the name
            name = stripped
            name_found = True

    # Deduplicate contacts preserving order
    seen = set()
    unique = []
    for t in contact_tokens:
        tk = t.lower().strip()
        if tk and tk not in seen:
            seen.add(tk)
            unique.append(t)

    return name, unique


def generate_pdf_reportlab(
    resume_text: str,
    output_path: str,
    candidate_name: str = "Candidate",
) -> str:
    """
    Professional ReportLab PDF — ATS-safe, single-column, clean formatting.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        topMargin=0.5 * inch,
        bottomMargin=0.55 * inch,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
    )
    styles  = _build_styles()
    elements = []

    lines = [l.rstrip() for l in resume_text.split('\n')]

    # ── 1. Extract name + contact info from top ──────────────────────────────
    detected_name, contacts = _extract_name_and_contacts(lines)
    display_name = detected_name if detected_name else candidate_name

    # ── 2. Name header ───────────────────────────────────────────────────────
    elements.append(Paragraph(_xml(display_name).upper(), styles['name']))
    elements.append(HRFlowable(
        width='100%', thickness=1.5, color=ACCENT,
        spaceBefore=0, spaceAfter=4,
    ))

    # ── 3. Contact line ──────────────────────────────────────────────────────
    if contacts:
        contact_str = '  |  '.join(_xml(c) for c in contacts)
        elements.append(Paragraph(contact_str, styles['contact']))
    else:
        elements.append(Spacer(1, 6))

    # ── 4. Determine where the body starts ───────────────────────────────────
    body_start_idx = 0
    for i, line in enumerate(lines[:12]):
        stripped = line.strip()
        if not stripped:
            continue
        # Skip name line and contact lines
        if stripped.lower() == display_name.lower() or _is_contact(stripped):
            body_start_idx = i + 1
        else:
            break

    # ── 5. Parse body ─────────────────────────────────────────────────────────
    pending_title  = None   # possible job title waiting for a date line
    prev_section   = False
    in_skills      = False

    body_lines = lines[body_start_idx:]
    i = 0
    while i < len(body_lines):
        raw  = body_lines[i]
        line = raw.strip()

        # Skip empty
        if not line:
            if not prev_section:
                elements.append(Spacer(1, 3))
            prev_section = False
            i += 1
            continue

        # Skip stray contact lines in body
        if _is_contact(line) and not in_skills:
            i += 1
            continue

        # ── Section header ──────────────────────────────────────────────────
        if _is_section(line):
            in_skills   = 'SKILL' in line.upper() or 'COMPETEN' in line.upper()
            pending_title = None
            elements.append(Spacer(1, 2))
            elements.append(Paragraph(_xml(line).upper(), styles['section']))
            elements.append(HRFlowable(
                width='100%', thickness=0.5, color=RULE_GREY,
                spaceBefore=1, spaceAfter=4,
            ))
            prev_section = True
            i += 1
            continue

        prev_section = False

        # ── Bullet ─────────────────────────────────────────────────────────
        if _is_bullet(line):
            pending_title = None
            text = _xml(_strip_bullet(line))
            if text:
                elements.append(Paragraph(f'&bull;&nbsp;&nbsp;{text}', styles['bullet']))
            i += 1
            continue

        # ── Date line → render as right-aligned date next to pending title ─
        if _is_date(line) and len(line) < 90:
            if pending_title:
                # Table: [job title] [date]
                tbl = Table(
                    [[
                        Paragraph(_xml(pending_title), styles['job_title']),
                        Paragraph(_xml(line),          styles['date']),
                    ]],
                    colWidths=[4.2 * inch, 2.3 * inch],
                )
                tbl.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING',  (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                    ('TOPPADDING',   (0, 0), (-1, -1), 2),
                    ('BOTTOMPADDING',(0, 0), (-1, -1), 1),
                ]))
                elements.append(tbl)
                pending_title = None
            else:
                elements.append(Paragraph(_xml(line), styles['company']))
            i += 1
            continue

        # ── Skills section body ────────────────────────────────────────────
        if in_skills:
            pending_title = None
            elements.append(Paragraph(_xml(line), styles['skills']))
            i += 1
            continue

        # ── ALL-CAPS short line → likely a job title or section subtext ───
        if line.isupper() and 4 < len(line) < 70:
            pending_title = None
            elements.append(Paragraph(_xml(line), styles['job_title']))
            i += 1
            continue

        # ── Look-ahead: if NEXT line has a date, this line is a job title ─
        next_line = body_lines[i + 1].strip() if i + 1 < len(body_lines) else ''
        if _is_date(next_line) and len(line) < 90 and not _is_bullet(line):
            pending_title = line
            i += 1
            continue

        # ── Generic body text ──────────────────────────────────────────────
        pending_title = None
        elements.append(Paragraph(_xml(line), styles['body']))
        i += 1

    # Build PDF
    doc.build(elements)
    logger.info(f"PDF generated: {output_path}")
    return output_path


def generate_pdf(
    resume_text: str,
    output_path: str,
    candidate_name: str = "Candidate",
) -> str:
    """Entry point — always uses ReportLab (Render/Linux safe)."""
    return generate_pdf_reportlab(resume_text, output_path, candidate_name)


def generate_docx(resume_text: str, output_path: str, candidate_name: str = "Candidate") -> str:
    """Kept for API compatibility — returns pdf path."""
    return output_path.replace('.pdf', '.docx')
