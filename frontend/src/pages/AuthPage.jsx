import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const [isLogin,  setIsLogin]  = useState(true)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [loading,  setLoading]  = useState(false)

  const { login, register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password, fullName)
        setSuccess('Account created! Please sign in.')
        setIsLogin(true)
        setPassword('')
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="or-logo-mark">OR</div>
        <span className="or-logo-text">Opti<span>Resume</span></span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="auth-card"
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text2)' }}>
            {isLogin ? 'Sign in to optimize your resume' : 'Start your journey to a better career'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="or-input"
                placeholder="John Doe"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="or-input"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="or-input"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                padding: '10px 14px', borderRadius: '9px',
                background: 'var(--redbg)', border: '1px solid var(--redbd)',
                color: 'var(--red)', fontSize: '13px', textAlign: 'center',
              }}
            >{error}</motion.p>
          )}

          {success && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                padding: '10px 14px', borderRadius: '9px',
                background: 'var(--greenbg)', border: '1px solid var(--greenbd)',
                color: 'var(--green)', fontSize: '13px', textAlign: 'center',
              }}
            >{success}</motion.p>
          )}

          <button
            type="submit"
            className="optimize-btn"
            disabled={loading}
            style={{ marginTop: '6px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%', animation: 'or-spin 0.8s linear infinite', display: 'inline-block',
                }} />
                Processing…
              </span>
            ) : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--text2)' }}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess('') }}
              style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>

      <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text3)' }}>
        OptiResume AI · Built for the hackathon
      </p>
    </div>
  )
}
