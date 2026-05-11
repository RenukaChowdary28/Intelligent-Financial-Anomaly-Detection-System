/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      colors: {
        nd: {
          bg:           '#0c1324',
          'bg-dim':     '#0c1324',
          'bg-bright':  '#33394c',
          'surface-0':  '#070d1f',
          'surface-1':  '#151b2d',
          'surface-2':  '#191f31',
          'surface-3':  '#23293c',
          'surface-4':  '#2e3447',
          'on-surface': '#dce1fb',
          'on-variant': '#bcc9cd',
          outline:      '#869397',
          'outline-v':  '#3d494c',
          cyan:         '#4cd7f6',
          'cyan-dim':   '#06b6d4',
          violet:       '#d0bcff',
          'violet-dim': '#571bc1',
          emerald:      '#4edea3',
          'emerald-dim':'#1bbd85',
          error:        '#ffb4ab',
          'error-dim':  '#93000a',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'neural-gradient': 'linear-gradient(135deg, #4cd7f6 0%, #d0bcff 50%, #4edea3 100%)',
        'cyan-violet':     'linear-gradient(135deg, #4cd7f6 0%, #d0bcff 100%)',
        'hex-pattern':     `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-68L4 14v36l24 14 24-14V14L28-2z' fill='none' stroke='%23dce1fb' stroke-opacity='0.03' stroke-width='1'/%3E%3C/svg%3E")`,
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':   'spin 8s linear infinite',
        'float':       'float 6s ease-in-out infinite',
        'shimmer':     'shimmer 2.5s linear infinite',
        'fade-slide':  'fadeSlide 0.35s ease-out',
        'glow-pulse':  'glowPulse 2.5s ease-in-out infinite',
        'scan-line':   'scanLine 3s linear infinite',
        'ping-slow':   'ping 2s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeSlide: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 12px rgba(76,215,246,0.15), 0 0 24px rgba(76,215,246,0.06)' },
          '50%':     { boxShadow: '0 0 24px rgba(76,215,246,0.30), 0 0 48px rgba(76,215,246,0.12)' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      boxShadow: {
        'glow-sm':     '0 0 10px rgba(76,215,246,0.10)',
        'glow':        '0 0 20px rgba(76,215,246,0.15)',
        'glow-lg':     '0 0 40px rgba(76,215,246,0.22)',
        'glow-violet': '0 0 20px rgba(208,188,255,0.15)',
        'glow-emerald':'0 0 20px rgba(78,222,163,0.15)',
        'glow-red':    '0 0 20px rgba(255,180,171,0.18)',
        'rim':         'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.04)',
        'card':        '0 4px 24px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.2)',
        'card-hover':  '0 8px 40px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.3)',
        'inner-glow':  'inset 0 0 20px rgba(76,215,246,0.04)',
      },
      borderRadius: {
        sm:   '0.25rem',
        DEFAULT: '0.5rem',
        md:   '0.75rem',
        lg:   '1rem',
        xl:   '1.5rem',
        '2xl': '2rem',
        full: '9999px',
      },
      spacing: {
        13: '3.25rem',
        18: '4.5rem',
      },
    },
  },
  plugins: [],
}
