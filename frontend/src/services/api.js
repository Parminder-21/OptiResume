import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'
// Root URL for endpoints mounted outside /api/v1 (e.g. /health)
const ROOT_URL = BASE_URL.replace(/\/api\/v1$/, '') || ''

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
})

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a PDF resume and get back extracted text.
 * @param {File} file  - PDF file object
 * @returns {Promise<{ resume_text, char_count, sections_detected }>}
 */
export const uploadResume = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// ─── Chat Questions ───────────────────────────────────────────────────────────

/**
 * Fetch pre-optimization questions from the AI chatbot step.
 * @param {string} resumeText      - Extracted or pasted resume text
 * @param {string} jobDescription  - Pasted job description
 * @returns {Promise<{ questions: [{id, question, hint}] }>}
 */
export const getChatQuestions = async (resumeText, jobDescription) => {
  const res = await api.post('/chat/questions', {
    resume_text:     resumeText,
    job_description: jobDescription,
  })
  return res.data
}

// ─── Optimize ─────────────────────────────────────────────────────────────────

// Simple per-tab rate limiter — prevents burning API credits on accidental double-clicks.
let _lastOptimizeAt = 0
const OPTIMIZE_COOLDOWN_MS = 30_000 // 30 seconds

/**
 * Run the full optimization pipeline.
 * @param {string} resumeText      - Extracted or pasted resume text
 * @param {string} jobDescription  - Pasted job description
 * @param {string} [userContext]   - Optional bundled answers from chatbot step
 * @returns {Promise<OptimizeResponse>}
 */
export const optimizeResume = async (resumeText, jobDescription, userContext = null) => {
  const now = Date.now()
  if (now - _lastOptimizeAt < OPTIMIZE_COOLDOWN_MS) {
    const wait = Math.ceil((OPTIMIZE_COOLDOWN_MS - (now - _lastOptimizeAt)) / 1000)
    throw new Error(`Please wait ${wait}s before optimizing again.`)
  }
  _lastOptimizeAt = now

  const res = await api.post('/optimize', {
    resume_text:     resumeText,
    job_description: jobDescription,
    ...(userContext ? { user_context: userContext } : {}),
  })
  return res.data
}

// ─── Download ─────────────────────────────────────────────────────────────────

/**
 * Generate and download the optimized resume as PDF.
 * @param {string} optimizedResume  - Optimized resume text
 * @param {string} candidateName    - Name for the PDF filename
 */
export const downloadPDF = async (optimizedResume, candidateName = 'Candidate') => {
  const res = await api.post(
    '/download',
    { optimized_resume: optimizedResume, candidate_name: candidateName },
    { responseType: 'blob' }
  )

  // Read the actual content type from the backend response
  const contentType = res.headers['content-type'] || 'application/pdf'
  const isDocx = contentType.includes('wordprocessingml')
  const ext = isDocx ? 'docx' : 'pdf'

  const url  = window.URL.createObjectURL(new Blob([res.data], { type: contentType }))
  const link = document.createElement('a')
  link.href  = url
  link.setAttribute('download', `${candidateName.replace(/\s+/g, '_')}_optimized_resume.${ext}`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

// ─── Health ───────────────────────────────────────────────────────────────────

// Health is mounted at /health on the backend, NOT under /api/v1
export const checkHealth = async () => {
  const res = await axios.get(`${ROOT_URL}/health`)
  return res.data
}