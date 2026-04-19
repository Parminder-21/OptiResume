import os
import re
from datetime import datetime
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx2pdf import convert
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib import colors
import logging

logger = logging.getLogger(__name__)

# ─── Color Palette for ReportLab ──────────────────────────────────────────────
NAVY      = colors.HexColor('#112244')
DARK_GREY = colors.HexColor('#333333')
LIGHT_GREY= colors.HexColor('#bbbbbb')

def _clean_text_reportlab(text: str) -> str:
    """Sanitize text for ReportLab — handles XML escaping and non-ASCII."""
    if not text: return ""
    replacements = {
        '\u2022': '-', '\u2023': '-', '\u2043': '-', '\u2013': '-', '\u2014': '--',
        '\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"',
        '\u2026': '...', '\u00a0': ' '
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return text.encode('ascii', 'ignore').decode('ascii')

def generate_pdf_reportlab(resume_text: str, output_path: str, candidate_name: str = "Candidate") -> str:
    """Fallback generator using ReportLab (Works on Linux/Render)."""
    doc = SimpleDocTemplate(
        output_path, pagesize=letter,
        topMargin=0.5*inch, bottomMargin=0.5*inch,
        leftMargin=0.6*inch, rightMargin=0.6*inch
    )
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('T', fontSize=20, textColor=NAVY, spaceAfter=14, alignment=TA_CENTER, fontName='Helvetica-Bold')
    sec_style = ParagraphStyle('S', fontSize=13, textColor=NAVY, spaceAfter=6, spaceBefore=10, fontName='Helvetica-Bold')
    body_style = ParagraphStyle('B', fontSize=10, leading=13, textColor=DARK_GREY, spaceAfter=6, fontName='Helvetica')
    bullet_style = ParagraphStyle('L', fontSize=10, leading=13, leftIndent=15, spaceAfter=4, textColor=DARK_GREY, fontName='Helvetica')

    elements = [
        Paragraph(_clean_text_reportlab(candidate_name).upper(), title_style),
        HRFlowable(width="100%", thickness=1, color=NAVY, spaceAfter=10)
    ]

    headers = ['EXPERIENCE', 'EDUCATION', 'SKILLS', 'PROJECTS', 'SUMMARY', 'CERTIFICATIONS', 'LANGUAGES']
    
    for line in resume_text.split('\n'):
        stripped = line.strip()
        if not stripped: continue
        
        if any(h in stripped.upper() for h in headers) and len(stripped) < 40:
            elements.append(Paragraph(stripped.upper(), sec_style))
            elements.append(HRFlowable(width="30%", thickness=0.5, color=LIGHT_GREY, spaceAfter=4, hAlign='LEFT'))
        elif stripped.startswith(('-', '*', '•')):
            clean = _clean_text_reportlab(stripped.lstrip('-*• '))
            if clean: elements.append(Paragraph(f"&bull; {clean}", bullet_style))
        else:
            elements.append(Paragraph(_clean_text_reportlab(stripped), body_style))

    doc.build(elements)
    return output_path

def generate_pdf(resume_text: str, output_path: str, candidate_name: str = "Candidate") -> str:
    """
    Primary Entry Point: Use Word Pipeline if possible, fallback to ReportLab on Linux.
    """
    docx_path = output_path.replace('.pdf', '.docx')
    
    # 1. Generate the professional Word Doc (python-docx works everywhere)
    try:
        doc = Document()
        # Narrow margins
        for section in doc.sections:
            section.top_margin = section.bottom_margin = Inches(0.5)
            section.left_margin = section.right_margin = Inches(0.7)
            
        # Header
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(candidate_name.upper())
        run.font.size = Pt(20); run.font.bold = True; run.font.color.rgb = RGBColor(17, 34, 68)
        
        # Body logic simplified for brevity
        headers = ['EXPERIENCE', 'EDUCATION', 'SKILLS', 'PROJECTS', 'SUMMARY']
        for line in resume_text.split('\n'):
            stripped = line.strip()
            if not stripped: continue
            if any(h in stripped.upper() for h in headers) and len(stripped) < 40:
                h_para = doc.add_paragraph()
                run = h_para.add_run(stripped.upper())
                run.font.size = Pt(13); run.font.bold = True; run.font.color.rgb = RGBColor(17, 34, 68)
            elif stripped.startswith(('-', '*', '•')):
                doc.add_paragraph(stripped.lstrip('-*• '), style='List Bullet')
            else:
                doc.add_paragraph(stripped)
                
        doc.save(docx_path)
    except Exception as e:
        logger.error(f"DOCX Creation error: {e}")

    # 2. Attempt Word -> PDF conversion (Only works on Windows/Mac with Word installed)
    try:
        convert(docx_path, output_path)
        if os.path.exists(output_path):
            return output_path
    except Exception as e:
        logger.warning(f"⚠️ docx2pdf failed: {e}. Falling back to ReportLab...")

    # 3. Final Fallback: Generate PDF using ReportLab (Ensures a PDF is ALWAYS returned)
    return generate_pdf_reportlab(resume_text, output_path, candidate_name)

def generate_docx(resume_text: str, output_path: str, candidate_name: str = "Candidate") -> str:
    """Helper to return path to the docx specifically."""
    return output_path.replace('.pdf', '.docx')
