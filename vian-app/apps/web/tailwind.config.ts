import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './stores/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base:     '#0d0d0d',
        surface:  '#141414',
        elevated: '#1a1a1a',
        accent:   '#3b82f6',
        'accent-hover': '#2563eb',
        border: {
          subtle:  '#1f1f1f',   // ui.md: --border-subtle
          mid:     '#2a2a2a',   // ui.md: --border-mid
          default: '#2a2a2a',   // alias — used in UI components
          strong:  '#3a3a3a',   // alias — used in UI components
        },
        text: {
          primary:   '#f0f0f0',  // ui.md: --text-primary
          muted:     '#888888',  // ui.md: --text-muted
          faint:     '#555555',  // ui.md: --text-faint
          secondary: '#888888',  // alias — used in UI components
        },
        green:   '#22c55e',
        red:     '#ef4444',
        yellow:  '#f59e0b',
        // Semantic aliases for UI components
        success: '#22c55e',
        warning: '#f59e0b',
        error:   '#ef4444',
      },
      fontFamily: {
        ui:   ['Geist', '-apple-system', 'sans-serif'],
        code: ['"Geist Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
        xs:    ['12px', { lineHeight: '1.5' }],
        sm:    ['13px', { lineHeight: '1.5' }],
        base:  ['14px', { lineHeight: '1.6' }],
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(0.85)' },
        },
        'file-appear': {
          from: { opacity: '0', transform: 'translateX(-4px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'gen-shimmer': {
          '0%':   { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: '200px 0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-dot':   'pulse-dot 1.4s ease-in-out infinite',
        'file-appear': 'file-appear 0.15s ease-out forwards',
        'gen-shimmer': 'gen-shimmer 1.5s linear infinite',
        'fade-in':     'fade-in 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
