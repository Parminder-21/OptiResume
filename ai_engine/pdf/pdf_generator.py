import os
import re
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
# Optional import: docx2pdf only works on Windows/Mac with MS Word installed
try:
    from docx2pdf import convert as _docx2pdf_convert
    DOCX2PDF_AVAILABLE = True
except ImportError:
    DOCX2PDF_AVAILABLE = False
    _tmp_log = __import__('logging').getLogger(__name__)
    _tmp_log.info("docx2pdf not available (Linux/Render) — will use ReportLab fallback")

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.lib import colors
import logging

logger = logging.getLogger(__name__)

# ─── Color Palette ─────────────────────────────────────────────────────────────
NAVY       = colors.HexColor('#1a2e4a')
ACCENT     = colors.HexColor('#2563eb')
DARK_GREY  = colors.HexColor('#2d2d2d')
MID_GREY   = colors.HexColor('#555555')
LIGHT_GREY = colors.HexColor('#cccccc')
WHITE      = colors.white

# ─── Section headers to detect ─────────────────────────────────────────────────
SECTION_HEADERS = [
    'EXPERIENCE', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE',
    'EDUCATION', 'SKILLS', 'TECHNICAL SKILLS', 'PROJECTS',
    'SUMMARY', 'PROFESSIONAL SUMMARY', 'OBJECTIVE',
    'CERTIFICATIONS', 'ACHIEVEMENTS', 'AWARDS',
    'LANGUAGES', 'INTERESTS', 'VOLUNTEER', 'PUBLICATIONS'
]

# ─── Regex patterns ────────────────────────────────────────────────────────────
EMAIL_RE    = re.compile(r'[\w.\-+]+@[\w.\-]+\.\w{2,}')
PHONE_RE    = re.compile(r'(\+?\d[\d\s\-().]{7,}\d)')
LINKEDIN_RE = re.compile(r'linkedin\.com/\S+', re.I)
GITHUB_RE   = re.compile(r'github\.com/\S+', re.I)
DATE_RE     = re.compile(
    r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)'
    r'[\s,\']*\d{4}|\d{4}\s*[-–]\s*(\d{4}|Present|present|Current|current|Till date)',
    re.I
)


def _clean(text: str) -> str:
    """Sanitize text for ReportLab XML parsing."""
    if not text:
        return ""
    replacements = {
        '\u2022': '-', '\u2023': '-', '\u2043': '-',
        '\u2013': '-', '\u2014': '--',
        '\u2018': "'", '\u2019': "'",
        '\u201c': '"', '\u201d': '"',
        '\u2026': '...', '\u00a0': ' ',
        '\u2019': "'",
    }
    for char, rep in replacements.items():
        text = text.replace(char, rep)
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return text.encode('ascii', 'ignore').decode('ascii').strip()


def _is_section_header(line: str) -> bool:
    upper = line.strip().upper()
    return any(upper == h or upper.startswith(h + ':') for h in SECTION_HEADERS)


def _is_contact_line(line: str) -> bool:
    return bool(EMAIL_RE.search(line) or PHONE_RE.search(line)
                or LINKEDIN_RE.search(line) or GITHUB_RE.search(line))


def _is_date_line(line: str) -> bool:
    """Line that likely contains a date range (job tenure)."""
    return bool(DATE_RE.search(line))


def _is_bullet(line: str) -> bool:
    return line.strip().startswith(('-', '*', '•', '◦', '▪', '›'))


def _build_styles():
    """Return a dict of named ParagraphStyles."""
    return {
        'name': ParagraphStyle(
            'name',
            fontSize=22, fontName='Helvetica-Bold',
            textColor=NAVY, alignment=TA_CENTER,
            spaceAfter=2, spaceBefore=0,
        ),
        'contact': ParagraphStyle(
            'contact',
            fontSize=9, fontName='Helvetica',
            textColor=MID_GREY, alignment=TA_CENTER,
            spaceAfter=8, leading=14,
        ),
        'section': ParagraphStyle(
            'section',
            fontSize=11, fontName='Helvetica-Bold',
            textColor=ACCENT, spaceBefore=12, spaceAfter=2,
            leading=14,
        ),
        'job_title': ParagraphStyle(
            'job_title',
            fontSize=10, fontName='Helvetica-Bold',
            textColor=DARK_GREY, spaceBefore=5, spaceAfter=1,
        ),
        'date_company': ParagraphStyle(
            'date_company',
            fontSize=9, fontName='Helvetica-Oblique',
            textColor=MID_GREY, spaceAfter=3,
        ),
        'body': ParagraphStyle(
            'body',
            fontSize=10, fontName='Helvetica',
            textColor=DARK_GREY, spaceAfter=3, leading=14,
        ),
        'bullet': ParagraphStyle(
            'bullet',
            fontSize=10, fontName='Helvetica',
            textColor=DARK_GREY, leftIndent=14,
            spaceAfter=2, leading=13,
            firstLineIndent=0,
        ),
        'skill_label': ParagraphStyle(
            'skill_label',
            fontSize=10, fontName='Helvetica',
            textColor=DARK_GREY, spaceAfter=3, leading=13,
        ),
    }


def generate_pdf_reportlab(resume_text: str, output_path: str, candidate_name: str = "Candidate") -> str:
    """
    Professional ReportLab PDF generator.
    Detects resume sections, contact info, job dates, and bullets
    to produce clean, ATS-friendly formatting.
    """
    doc = SimpleDocTemplate(
        output_path, pagesize=letter,
        topMargin=0.55 * inch, bottomMargin=0.55 * inch,
        leftMargin=0.65 * inch, rightMargin=0.65 * inch,
    )
    styles = _build_styles()
    elements = []

    lines = resume_text.split('\n')

    # ── Collect contact info lines from top of resume ──────────────────────────
    contact_parts = []
    body_start = 0
    for i, line in enumerate(lines[:12]):
        stripped = line.strip()
        if not stripped:
            continue
        # Skip the candidate name line itself
        if stripped.lower() == candidate_name.lower() or stripped.upper() == candidate_name.upper():
            body_start = i + 1
            continue
        if _is_contact_line(stripped):
            contact_parts.append(_clean(stripped))
            body_start = i + 1

    # ── Header: Name ───────────────────────────────────────────────────────────
    elements.append(Paragraph(_clean(candidate_name).upper(), styles['name']))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=4))

    # ── Header: Contact info (comma-separated on one line) ─────────────────────
    if contact_parts:
        elements.append(Paragraph("  |  ".join(contact_parts), styles['contact']))
    else:
        elements.append(Spacer(1, 6))

    # ── Body: Parse remaining lines ────────────────────────────────────────────
    in_skills_section = False
    prev_was_section = False

    for line in lines[body_start:]:
        stripped = line.strip()

        if not stripped:
            if not prev_was_section:
                elements.append(Spacer(1, 2))
            prev_was_section = False
            continue

        # Skip contact lines already captured
        if _is_contact_line(stripped) and not in_skills_section:
            prev_was_section = False
            continue

        # Section header
        if _is_section_header(stripped):
            in_skills_section = 'SKILL' in stripped.upper()
            elements.append(Paragraph(_clean(stripped).upper(), styles['section']))
            elements.append(HRFlowable(
                width="100%", thickness=0.5, color=LIGHT_GREY,
                spaceAfter=4, spaceBefore=0
            ))
            prev_was_section = True
            continue

        prev_was_section = False

        # Bullet point
        if _is_bullet(stripped):
            clean_bullet = _clean(stripped.lstrip('-*•◦▪› '))
            if clean_bullet:
                elements.append(Paragraph(f"&bull;&nbsp; {clean_bullet}", styles['bullet']))
            continue

        # Date/company line (italic, smaller)
        if _is_date_line(stripped) and len(stripped) < 80:
            elements.append(Paragraph(_clean(stripped), styles['date_company']))
            continue

        # Skills section: render as body text (preserve colon-separated format)
        if in_skills_section:
            elements.append(Paragraph(_clean(stripped), styles['skill_label']))
            continue

        # Generic body line — short caps lines treated as job titles
        if stripped.isupper() and 10 < len(stripped) < 60:
            elements.append(Paragraph(_clean(stripped), styles['job_title']))
        else:
            elements.append(Paragraph(_clean(stripped), styles['body']))

    doc.build(elements)
    logger.info(f"✅ PDF generated via ReportLab: {output_path}")
    return output_path


def generate_pdf(resume_text: str, output_path: str, candidate_name: str = "Candidate") -> str:
    """
    Primary Entry Point: Use Word Pipeline if available, fallback to ReportLab on Linux.
    """
    docx_path = output_path.replace('.pdf', '.docx')

    # 1. Generate professional Word Doc (python-docx works everywhere)
    try:
        doc = Document()
        for section in doc.sections:
            section.top_margin = section.bottom_margin = Inches(0.5)
            section.left_margin = section.right_margin = Inches(0.7)

        # Name header
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(candidate_name.upper())
        run.font.size = Pt(20)
        run.font.bold = True
        run.font.color.rgb = RGBColor(26, 46, 74)

        headers_list = ['EXPERIENCE', 'EDUCATION', 'SKILLS', 'PROJECTS', 'SUMMARY',
                        'CERTIFICATIONS', 'ACHIEVEMENTS', 'LANGUAGES']
        for line in resume_text.split('\n'):
            stripped = line.strip()
            if not stripped:
                continue
            if _is_section_header(stripped):
                h_para = doc.add_paragraph()
                run = h_para.add_run(stripped.upper())
                run.font.size = Pt(12)
                run.font.bold = True
                run.font.color.rgb = RGBColor(37, 99, 235)
            elif _is_bullet(stripped):
                doc.add_paragraph(stripped.lstrip('-*•◦▪› '), style='List Bullet')
            elif _is_date_line(stripped):
                p = doc.add_paragraph(stripped)
                p.runs[0].italic = True if p.runs else None
            else:
                doc.add_paragraph(stripped)

        doc.save(docx_path)
    except Exception as e:
        logger.error(f"DOCX creation error: {e}")

    # 2. Attempt Word -> PDF (Windows/Mac only)
    if DOCX2PDF_AVAILABLE:
        try:
            _docx2pdf_convert(docx_path, output_path)
            if os.path.exists(output_path):
                return output_path
        except Exception as e:
            logger.warning(f"⚠️ docx2pdf failed: {e}. Falling back to ReportLab...")

    # 3. Fallback: ReportLab (always works on Linux/Render)
    return generate_pdf_reportlab(resume_text, output_path, candidate_name)


def generate_docx(resume_text: str, output_path: str, candidate_name: str = "Candidate") -> str:
    """Return path to the .docx file (generated as a side effect of generate_pdf)."""
    return output_path.replace('.pdf', '.docx')
