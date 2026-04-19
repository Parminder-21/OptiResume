import sys
import os
import tempfile
import logging

# Allow importing ai_engine from project root
backend_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
project_root = os.path.dirname(backend_root)
sys.path.insert(0, project_root)

from ai_engine.pdf.pdf_generator import generate_pdf

logger = logging.getLogger(__name__)

def create_optimized_pdf(optimized_resume: str, candidate_name: str = "Candidate") -> tuple[bytes, str]:
    """
    Generate the optimized resume as a PDF.
    Tries Word-to-PDF first, defaults to ReportLab for a guaranteed PDF on Render.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = os.path.join(tmpdir, "resume.pdf") 
        try:
            # generate_pdf is now guaranteed to return a .pdf path 
            # (either via docx2pdf or ReportLab fallback)
            actual_path = generate_pdf(
                resume_text=optimized_resume,
                output_path=output_path,
                candidate_name=candidate_name
            )
            
            with open(actual_path, "rb") as f:
                file_data = f.read()
            
            return file_data, "application/pdf"
            
        except Exception as e:
            logger.error(f"PDF generation failed: {e}", exc_info=True)
            # Hard fallback to plain text if everything crashes
            return optimized_resume.encode('utf-8'), "text/plain"