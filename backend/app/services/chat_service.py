"""Chat service — generates targeted pre-optimization questions with options via Groq."""

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
    Generate 4 targeted pre-optimization questions using Groq.
    Each question includes 3-4 quick-reply option chips + a free-text field.

    Returns:
    [
      {
        "id": "q1",
        "question": "...",
        "options": ["Option A", "Option B", "Option C", "None of these"],
        "hint": "Or describe in your own words..."
      }
    ]
    """
    api_key = settings.GROQ_API_KEY
    if not api_key or "gsk_" not in api_key:
        logger.warning("GROQ_API_KEY missing — returning fallback questions")
        return _fallback_questions(resume_text, job_description)

    # Find missing JD skills (keywords in JD not in resume)
    resume_kw = _extract_keywords(resume_text)
    jd_kw     = _extract_keywords(job_description)
    missing   = sorted(jd_kw - resume_kw)[:20]
    missing_str = ", ".join(missing) if missing else "none identified"

    system_prompt = (
        "You are an expert career coach helping gather context before AI resume optimization.\n"
        "Generate exactly 4 SHORT, targeted questions. Each question must have 3-4 quick-reply options.\n\n"
        "QUESTION TYPES TO COVER:\n"
        "1. A YES/NO question about a specific missing skill from the JD (with experience-level options).\n"
        "2. A question about quantifiable achievements/metrics.\n"
        "3. A question about the candidate's most relevant project/role.\n"
        "4. A question about certifications or additional learning.\n\n"
        "OPTION RULES:\n"
        "- Options must be SHORT (3-8 words each), clickable chips.\n"
        "- Always include 'None / Not applicable' or similar as the last option.\n"
        "- Options should be realistic answers a candidate might pick.\n"
        "- For skill questions: options like 'Yes, professionally', 'Yes, in side projects', 'Basic knowledge only', 'No experience'.\n"
        "- For metrics: options like 'Yes, I have percentages', 'Yes, I have user counts', 'Rough estimates only', 'No metrics available'.\n\n"
        "Return ONLY a valid JSON array, no markdown, no extra text:\n"
        '[\n'
        '  {\n'
        '    "id": "q1",\n'
        '    "question": "Short conversational question?",\n'
        '    "options": ["Option A", "Option B", "Option C", "None / Not applicable"],\n'
        '    "hint": "Or add more context here..."\n'
        '  }\n'
        ']'
    )

    user_message = (
        f"Resume (first 1200 chars):\n{resume_text[:1200]}\n\n"
        f"Job Description (first 1200 chars):\n{job_description[:1200]}\n\n"
        f"Skills in JD not in resume: {missing_str}\n\n"
        "Generate exactly 4 conversational questions with quick-reply options."
    )

    try:
        import httpx
        client = Groq(api_key=api_key, http_client=httpx.Client(proxies={}))
        response = client.chat.completions.create(
            model=settings.MODEL_NAME,
            max_tokens=1200,
            temperature=0.3,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
        )
        text = response.choices[0].message.content
        logger.info(f"[CHAT] Groq response preview: {text[:400]}")

        # Parse JSON robustly
        text = re.sub(r'```(?:json)?', '', text).strip()
        bracket = text.find('[')
        if bracket != -1:
            depth = 0
            for i, ch in enumerate(text[bracket:], bracket):
                if ch == '[':   depth += 1
                elif ch == ']':
                    depth -= 1
                    if depth == 0:
                        questions = json.loads(text[bracket:i+1])
                        # Ensure options exist on each question
                        for q in questions:
                            if not q.get('options'):
                                q['options'] = ['Yes', 'No', 'Not applicable']
                        logger.info(f"[CHAT] Generated {len(questions)} questions with options")
                        return questions[:4]

    except Exception as e:
        logger.error(f"[CHAT] Groq failed: {e}", exc_info=True)

    return _fallback_questions(resume_text, job_description)


def _fallback_questions(resume_text: str, job_description: str) -> list[dict]:
    """Fallback questions with options when Groq is unavailable."""
    resume_lower = resume_text.lower()
    jd_lower     = job_description.lower()

    questions = []

    # Detect a missing skill for q1
    tech_skills = [
        ('docker',      ['Yes, professionally', 'Yes, in personal projects', 'Basic knowledge', 'No experience']),
        ('kubernetes',  ['Yes, professionally', 'Basic knowledge only', 'Familiar with concepts', 'No experience']),
        ('aws',         ['AWS certified', 'Used in projects', 'Basic familiarity', 'No experience']),
        ('react',       ['Yes, 1+ year exp', 'Side projects only', 'Currently learning', 'No experience']),
        ('postgresql',  ['Yes, used in production', 'Yes, in projects', 'Basic SQL knowledge', 'No experience']),
        ('redis',       ['Yes, professionally', 'Yes, self-taught', 'Familiar with concepts', 'No experience']),
        ('tensorflow',  ['Yes, trained models', 'Experimented with it', 'Familiar with APIs', 'No experience']),
        ('fastapi',     ['Yes, built APIs', 'Used in projects', 'Basic knowledge', 'No experience']),
    ]

    skill_q_added = False
    for skill, options in tech_skills:
        if skill in jd_lower and skill not in resume_lower:
            questions.append({
                "id": "q1",
                "question": f"The job requires {skill.capitalize()} — what's your experience level?",
                "options": options,
                "hint": f"Or tell us more about your {skill.capitalize()} experience...",
            })
            skill_q_added = True
            break

    if not skill_q_added:
        questions.append({
            "id": "q1",
            "question": "How would you rate your experience with the core technologies in this job?",
            "options": ["Expert (3+ years)", "Intermediate (1-3 years)", "Beginner (<1 year)", "Learning actively"],
            "hint": "Or mention specific tools you're most confident with...",
        })

    questions += [
        {
            "id": "q2",
            "question": "Do you have any measurable achievements you could add to your resume?",
            "options": [
                "Yes, I have percentages/numbers",
                "Yes, I have user/scale metrics",
                "Rough estimates only",
                "No specific metrics",
            ],
            "hint": "e.g. Reduced latency by 40%, served 50K users, saved $20K...",
        },
        {
            "id": "q3",
            "question": "Which best describes your most relevant experience for this role?",
            "options": [
                "Full-time professional role",
                "Internship / contract work",
                "Personal / open-source projects",
                "Academic / coursework only",
            ],
            "hint": "Give a quick summary of that project or role...",
        },
        {
            "id": "q4",
            "question": "Do you have any certifications or courses relevant to this position?",
            "options": [
                "Yes, industry certifications",
                "Online courses (Coursera, Udemy etc.)",
                "Currently studying for one",
                "None currently",
            ],
            "hint": "e.g. AWS Certified Developer, Google ML crash course...",
        },
    ]

    return questions[:4]
