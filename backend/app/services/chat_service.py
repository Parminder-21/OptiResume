"""Chat service — generates targeted pre-optimization questions via Groq."""

import json
import re
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from groq import Groq
from app.core.config import settings

logger = logging.getLogger(__name__)


def _extract_keywords(text: str) -> set:
    """Simple keyword extractor for overlap check."""
    words = re.findall(r'\b\w+\b', text.lower())
    stopwords = {
        'the', 'this', 'that', 'with', 'from', 'have', 'which', 'your',
        'their', 'been', 'were', 'also', 'more', 'used', 'such', 'them',
        'will', 'would', 'could', 'should', 'must', 'shall', 'may', 'might',
        'into', 'onto', 'over', 'under', 'about', 'above', 'below', 'between',
        'within', 'without', 'during', 'before', 'after', 'since', 'until',
    }
    return {w for w in words if len(w) >= 4 and w not in stopwords}


def generate_questions(resume_text: str, job_description: str) -> list[dict]:
    """
    Generate 3-5 targeted pre-optimization questions using Groq.

    Returns a list of question dicts:
    [{"id": "q1", "question": "...", "hint": "..."}]
    """
    api_key = settings.GROQ_API_KEY
    if not api_key or "gsk_" not in api_key:
        logger.warning("GROQ_API_KEY missing — returning fallback questions")
        return _fallback_questions(resume_text, job_description)

    # Find missing JD skills (keywords in JD not in resume)
    resume_kw = _extract_keywords(resume_text)
    jd_kw = _extract_keywords(job_description)
    missing = sorted(jd_kw - resume_kw)[:20]
    missing_str = ", ".join(missing) if missing else "none identified"

    system_prompt = (
        "You are an expert career coach helping to gather context before AI resume optimization.\n"
        "Your job is to generate 4-5 SHORT, targeted questions to ask the user.\n\n"
        "QUESTION GOALS:\n"
        "1. Ask about specific skills from the JD that appear missing from the resume.\n"
        "2. Ask whether the candidate has metrics/numbers for their achievements.\n"
        "3. Ask about the most recent or relevant project/role and their specific contribution.\n"
        "4. Ask about any certifications, courses, or side projects related to the JD.\n\n"
        "RULES:\n"
        "- Keep each question short and conversational (1 sentence max).\n"
        "- Don't ask about skills that are clearly in the resume already.\n"
        "- Provide a short 'hint' placeholder text for the answer input.\n"
        "- Generate exactly 4-5 questions, no more.\n\n"
        "Return ONLY a valid JSON array, no markdown, no extra text:\n"
        '[{"id": "q1", "question": "...", "hint": "e.g. Yes, I used Docker in..."}, ...]'
    )

    user_message = (
        f"Resume (first 1500 chars):\n{resume_text[:1500]}\n\n"
        f"Job Description (first 1500 chars):\n{job_description[:1500]}\n\n"
        f"Skills in JD not clearly present in resume: {missing_str}\n\n"
        "Generate 4-5 targeted questions to gather context for better optimization."
    )

    try:
        import httpx
        client = Groq(api_key=api_key, http_client=httpx.Client(proxies={}))
        response = client.chat.completions.create(
            model=settings.MODEL_NAME,
            max_tokens=800,
            temperature=0.3,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
        )
        text = response.choices[0].message.content
        logger.info(f"[CHAT] Groq response: {text[:300]}")

        # Parse JSON
        text = re.sub(r'```(?:json)?', '', text).strip()
        bracket = text.find('[')
        if bracket != -1:
            depth = 0
            for i, ch in enumerate(text[bracket:], bracket):
                if ch == '[': depth += 1
                elif ch == ']':
                    depth -= 1
                    if depth == 0:
                        questions = json.loads(text[bracket:i+1])
                        logger.info(f"[CHAT] Generated {len(questions)} questions")
                        return questions[:5]

    except Exception as e:
        logger.error(f"[CHAT] Groq failed: {e}", exc_info=True)

    return _fallback_questions(resume_text, job_description)


def _fallback_questions(resume_text: str, job_description: str) -> list[dict]:
    """Fallback questions when Groq is unavailable."""
    resume_lower = resume_text.lower()
    jd_lower = job_description.lower()

    questions = []

    # Missing skills check
    tech_skills = ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'redis', 'kafka',
                   'react', 'vue', 'angular', 'typescript', 'mongodb', 'postgresql',
                   'fastapi', 'django', 'flask', 'tensorflow', 'pytorch', 'spark']

    missing_from_resume = [s for s in tech_skills if s in jd_lower and s not in resume_lower]

    if missing_from_resume:
        skill = missing_from_resume[0].capitalize()
        questions.append({
            "id": "q1",
            "question": f"The job mentions {skill} — do you have any experience with it?",
            "hint": f"e.g. Yes, I used {skill} in a side project to...",
        })

    questions += [
        {
            "id": "q2",
            "question": "Do you have any numbers or metrics for your achievements (e.g. speed improvements, users served, cost reductions)?",
            "hint": "e.g. Reduced API latency by 40%, served 10K+ daily users...",
        },
        {
            "id": "q3",
            "question": "Describe your most relevant project or role for this position in 1-2 sentences.",
            "hint": "e.g. I built a REST API using FastAPI and PostgreSQL for...",
        },
        {
            "id": "q4",
            "question": "Any relevant certifications, courses, or self-learning related to this role?",
            "hint": "e.g. AWS Certified Developer, Coursera ML course...",
        },
    ]

    return questions[:4]
