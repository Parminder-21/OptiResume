# OptiResume AI - Backend (FastAPI)

The engine behind the OptiResume AI platform, providing high-performance resume parsing, ATS scoring, and LLM-powered content optimization.

## 🚀 Core Technologies
- **FastAPI**: Modern, high-performance web framework.
- **Groq SDK**: Ultra-fast LLM inference using Llama-3.3-70b.
- **Sentence-Transformers**: Local semantic matching (SBERT).
- **ReportLab & python-docx**: Dual-engine document generation.
- **SQLAlchemy & PostgreSQL**: Robust data persistence.

## 🛠️ Setup & Installation

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Configuration**:
   Create a `.env` file in this directory:
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/db
   JWT_SECRET=your_super_secret_key
   GROQ_API_KEY=gsk_...
   VITE_API_URL=http://localhost:8000/api/v1
   ```

3. **Run the Server**:
   ```bash
   python run.py
   ```

## 📊 API Architecture

| Path | Method | Description |
|---|---|---|
| `/api/v1/auth/register` | `POST` | User registration |
| `/api/v1/auth/login` | `POST` | JWT Authentication |
| `/api/v1/upload` | `POST` | PDF Resume Upload & Parsing |
| `/api/v1/optimize` | `POST` | Core AI optimization pipeline |
| `/api/v1/download` | `POST` | Optimized PDF/DOCX generation |

## 🧪 Advanced Features
- **ATS Quality Guardrails**: Prevents processing of non-resume documents via semantic heuristic checks.
- **Proxy-Bypass Architecture**: Custom `httpx` implementation to ensure Groq reliability on cloud platforms like Render.
- **Dual-Engine Generation**: Intelligent fallback from Word-to-PDF (`docx2pdf`) to native `ReportLab` depending on system capabilities.
