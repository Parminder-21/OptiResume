# ⚡ OptiResume AI

### **Transform your Resume for the Modern ATS Era.**

OptiResume AI is a production-grade platform designed to help candidates beat Applicant Tracking Systems (ATS) using state-of-the-art NLP and Large Language Models. Built for hackathons, optimized for production.

---

## 🌟 Key Features

- **🎬 Premium Cinematic UI**: State-of-the-art **Glassmorphism 2.0** design, interactive 3D elements (Three.js), customized mouse cursors, and liquid mesh gradients.
- **🌗 Dynamic Theme System**: Seamless toggle between a Deep Space Dark Mode and a crisp Professional Light Mode.
- **🎯 Real-Time ATS Scoring**: Instant scoring of your resume against any job description using SBERT semantic matching.
- **🤖 Groq-Powered Optimization**: Bullet point rewriting using `Llama-3.3-70b` for high-impact, keyword-rich content.
- **📊 Skill Gap Analysis**: Intelligent detection of missing critical, medium, and low-priority skills.
- **📄 Dual-Engine Document Export**: Professional generation of PDF and DOCX files.
- **✨ Fluid Motion**: Seamless page transitions and micro-interactions powered by Framer Motion.

---

## 🚀 Tech Stack

| Component | Technology |
|---|---|
| **Backend** | FastAPI (Python 3.11) |
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Database** | PostgreSQL |
| **AI Models** | Groq (Llama-3.3-70b), SBERT (all-MiniLM-L6-v2) |
| **Document** | python-docx, docx2pdf, ReportLab |

---

## 🛠️ Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Environment Variables (.env)
```env
# BACKEND
GROQ_API_KEY=gsk_...
DATABASE_URL=postgresql://...
JWT_SECRET=...

# FRONTEND (Vite)
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 📁 Project Structure

```
optiresume/
├── backend/            # FastAPI Server & API Logic
├── frontend/           # React + Vite Application
├── ai_engine/          # NLP, Embeddings & LLM Orchestration
├── data/               # Sample Resumes & JDs
└── README.md           # This guide
```

---

## 🏆 Submission Details

Developed by **Parminder** as part of the **Nikita Hackathon**. This project aims to bridge the gap between candidate experience and machine-automated hiring.

---

## 📄 License & Contribution

This project is open-source. For contributions, please submit a Pull Request to the [upstream repository](https://github.com/Nikita-baghela07/resume-checker-.git).

---
**Version**: 1.0.0 | **Status**: Production Ready ✅
