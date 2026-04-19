import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def compute_similarity(text_a: str, text_b: str, model=None) -> float:
    """
    Compute semantic similarity between two texts using lightweight TF-IDF.
    Bypasses PyTorch entirely to prevent 512MB RAM limit crashes.
    Returns score 0-100.
    """
    try:
        # If texts are empty or too small, return baseline
        if not text_a or not text_b or len(text_a.strip()) < 10 or len(text_b.strip()) < 10:
            return 20.0
            
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([text_a, text_b])
        
        raw_similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        
        # TF-IDF cosine similarity behaves differently than SBERT; normalize to a nice 0-100 curve
        normalized = raw_similarity * 2.0 
        score = max(10.0, min(100.0, normalized * 100))
        return round(score, 1)
    except Exception as e:
        print(f"TF-IDF Error: {e}")
        return 50.0


def compute_keyword_overlap(resume_text: str, job_description: str) -> float:
    """
    Compute keyword overlap between resume and job description.
    Extracts keywords (words 4+ chars) and calculates overlap percentage.
    Returns score 0-100.
    """
    try:
        # Extract keywords (words of 4+ characters, case-insensitive)
        def extract_keywords(text: str) -> set:
            words = re.findall(r'\b\w+\b', text.lower())
            # Filter: 4+ chars, exclude common words
            common = {'the', 'this', 'that', 'with', 'from', 'have', 'which', 'your',
                     'their', 'been', 'were', 'also', 'more', 'used', 'such', 'them'}
            return {w for w in words if len(w) >= 4 and w not in common}
        
        resume_keywords = extract_keywords(resume_text)
        jd_keywords = extract_keywords(job_description)
        
        if not jd_keywords:
            return 10.0
        
        # Calculate overlap
        overlap = len(resume_keywords & jd_keywords)
        coverage = overlap / len(jd_keywords)
        
        # Normalize to 0-100 scale
        score = max(10.0, min(100.0, coverage * 100))
        return round(score, 1)
    
    except Exception:
        return 50.0
