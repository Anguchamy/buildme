import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand — Ocean Teal
        brand: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',   // teal-500
          600: '#0d9488',   // teal-600 — primary
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Accent — Electric Cyan
        accent: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',   // cyan-500
          600: '#0891b2',
          700: '#0e7490',
        },
        // Amber highlight for CTAs / badges
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Success green
        success: {
          400: '#4ade80',
          500: '#22c55e',
        },
        // Dark mode — deep slate-navy
        surface: {
          0: '#060b12',
          1: '#0a1220',
          2: '#0f1b2d',
          3: '#162336',
          4: '#1e2f45',
          5: '#263c57',
        },
        // Light mode surfaces — soft white/teal tinted
        light: {
          0: '#ffffff',
          1: '#f7fdfc',
          2: '#edfaf8',
          3: '#d0f0ec',
          4: '#a8e6df',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand':    'linear-gradient(135deg, #0d9488 0%, #06b6d4 60%, #0891b2 100%)',
        'gradient-brand-45': 'linear-gradient(45deg, #0d9488, #06b6d4)',
        'gradient-dark':     'linear-gradient(135deg, #060b12 0%, #0a1220 100%)',
        'gradient-card':     'linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(6,182,212,0.04) 100%)',
        'gradient-glow':     'radial-gradient(ellipse at center, rgba(13,148,136,0.18) 0%, transparent 70%)',
        'shimmer':           'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
      },
      boxShadow: {
        'brand':        '0 0 20px rgba(13,148,136,0.35)',
        'brand-lg':     '0 0 40px rgba(13,148,136,0.45)',
        'brand-inset':  'inset 0 0 20px rgba(13,148,136,0.1)',
        'card':         '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        'card-hover':   '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(13,148,136,0.15)',
        'card-dark':    '0 4px 24px rgba(0,0,0,0.5)',
        'card-dark-hover': '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(13,148,136,0.2)',
        'glow':         '0 0 30px rgba(13,148,136,0.25)',
        'glow-lg':      '0 0 60px rgba(13,148,136,0.3)',
        'input-focus':  '0 0 0 3px rgba(13,148,136,0.15)',
      },
      animation: {
        'fade-in':        'fadeIn 0.3s ease-in-out',
        'slide-up':       'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow':     'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':          'float 6s ease-in-out infinite',
        'shimmer':        'shimmer 2.2s linear infinite',
        'scale-in':       'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow-pulse':     'glowPulse 3s ease-in-out infinite',
        'border-flow':    'borderFlow 4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.94)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(13,148,136,0.25)' },
          '50%':      { boxShadow: '0 0 40px rgba(13,148,136,0.45)' },
        },
        borderFlow: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
} satisfies Config
