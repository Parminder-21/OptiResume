/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          400: '#6b8cff',
          500: '#4f6ef7',
          600: '#3a55e8',
          700: '#2d42cc',
        },
        'bg-page': 'var(--bg-page)',
        'bg-surface': 'var(--bg-surface)',
        'bg-glass': 'var(--bg-glass)',
        'text-pri': 'var(--text-pri)',
        'text-sec': 'var(--text-sec)',
        'border-pri': 'var(--border-pri)',
        'brand-pri': 'var(--brand-pri)',
        'brand-sec': 'var(--brand-sec)',
        'accent-glow': 'var(--accent-glow)',
        success: '#22c55e',
        warn:    '#f59e0b',
        danger:  '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'score-fill':  'scoreFill 1.2s ease-out forwards',
        'fade-in-up':  'fadeInUp 0.5s ease-out forwards',
      },
      keyframes: {
        scoreFill: {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--target-width)' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}