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


def _group_skills(items: list[str], cols: int = 3) -> list[list[str]]:
    """Split skills list into rows for a table."""
    rows = []
    for i in range(0, len(items), cols):
        rows.append(items[i:i+cols])
    return rows


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
        topMargin=0.4 * inch,
        bottomMargin=0.4 * inch,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
    )
    styles  = _build_styles()
    elements = []

    lines = [l.rstrip() for l in resume_text.split('\n')]

    # ── 1. Extract name + contact info ───────────────────────────────────────
    detected_name, contacts = _extract_name_and_contacts(lines)
    display_name = detected_name if detected_name else candidate_name

    # ── 2. Name header ───────────────────────────────────────────────────────
    elements.append(Paragraph(_xml(display_name).upper(), styles['name']))
    elements.append(HRFlowable(width='100%', thickness=1.5, color=ACCENT, spaceBefore=0, spaceAfter=4))

    # ── 3. Contact line ──────────────────────────────────────────────────────
    if contacts:
        contact_str = '  &bull;  '.join(_xml(c) for c in contacts)
        elements.append(Paragraph(contact_str, styles['contact']))
    else:
        elements.append(Spacer(1, 6))

    # ── 4. Main Parsing Loop ─────────────────────────────────────────────────
    body_start_idx = 0
    for i, line in enumerate(lines[:12]):
        stripped = line.strip()
        if stripped and (stripped.lower() == display_name.lower() or _is_contact(stripped)):
            body_start_idx = i + 1
        elif stripped:
            break

    body_lines = lines[body_start_idx:]
    pending_title = None
    in_skills = False
    skill_buffer = []

    i = 0
    while i < len(body_lines):
        raw = body_lines[i]
        line = raw.strip()

        if not line:
            # If we were in skills, flush them
            if in_skills and skill_buffer:
                rows = _group_skills(skill_buffer)
                tbl = Table(rows, colWidths=[2.2 * inch]*3)
                tbl.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('TEXTCOLOR', (0, 0), (-1, -1), DARK),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ]))
                elements.append(tbl)
                skill_buffer = []
            elements.append(Spacer(1, 4))
            i += 1
            continue

        if _is_section(line):
            # Flush skills if entering new section
            if skill_buffer:
                rows = _group_skills(skill_buffer)
                tbl = Table(rows, colWidths=[2.2 * inch]*3)
                elements.append(tbl)
                skill_buffer = []

            in_skills = 'SKILL' in line.upper() or 'COMPETEN' in line.upper()
            elements.append(Spacer(1, 8))
            elements.append(Paragraph(_xml(line).upper(), styles['section']))
            elements.append(HRFlowable(width='100%', thickness=0.5, color=RULE_GREY, spaceBefore=1, spaceAfter=4))
            i += 1
            continue

        # Handle Skills Grid
        if in_skills:
            # Try to split by commas or tabs
            parts = [p.strip() for p in re.split(r'[,|•\t]', line) if p.strip()]
            skill_buffer.extend([_xml(p) for p in parts])
            i += 1
            continue

        # Handle Bullets
        if _is_bullet(line):
            pending_title = None
            text = _xml(_strip_bullet(line))
            elements.append(Paragraph(f'&bull;&nbsp;&nbsp;{text}', styles['bullet']))
            i += 1
            continue

        # Handle Experience/Education Date Alignment
        if _is_date(line) and len(line) < 60:
            title_text = pending_title if pending_title else ""
            tbl = Table([[Paragraph(_xml(title_text), styles['job_title'] if pending_title else styles['company']), 
                           Paragraph(_xml(line), styles['date'])]], colWidths=[4.8*inch, 1.8*inch])
            tbl.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'), ('LEFTPADDING',(0,0),(-1,-1),0)]))
            elements.append(tbl)
            pending_title = None
            i += 1
            continue

        # Look ahead for dates
        next_line = body_lines[i+1].strip() if i+1 < len(body_lines) else ""
        if _is_date(next_line) and len(line) < 100:
            pending_title = line
            i += 1
            continue

        # General Text
        elements.append(Paragraph(_xml(line), styles['body']))
        i += 1

    # Final build
    doc.build(elements)
    return output_path


def generate_pdf(resume_text: str, output_path: str, candidate_name: str = "Candidate") -> str:
    return generate_pdf_reportlab(resume_text, output_path, candidate_name)

def generate_docx(resume_text: str, output_path: str, candidate_name: str = "Candidate") -> str:
    return output_path.replace('.pdf', '.docx')
