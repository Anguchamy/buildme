import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Neon violet/purple primary ──
        brand: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        // ── Neon cyan accent ──
        accent: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
        // ── Neon pink/rose ──
        neon: {
          pink:   '#f472b6',
          rose:   '#fb7185',
          violet: '#a78bfa',
          cyan:   '#22d3ee',
          green:  '#34d399',
          amber:  '#fbbf24',
        },
        // ── Deep space dark surfaces ──
        surface: {
          0:  '#03040a',   // deepest black-blue
          1:  '#070b14',
          2:  '#0c1221',
          3:  '#111827',   // cards base
          4:  '#1a2640',
          5:  '#1f3054',
          6:  '#243868',
        },
        // ── Light mode (minimal, stays clean) ──
        light: {
          0: '#ffffff',
          1: '#f8f9ff',
          2: '#f0f2ff',
          3: '#e4e7ff',
          4: '#c7ccf5',
        },
        success: { 400: '#34d399', 500: '#10b981' },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        // Primary gradients
        'grad-primary':   'linear-gradient(135deg, #9333ea 0%, #a855f7 40%, #06b6d4 100%)',
        'grad-warm':      'linear-gradient(135deg, #9333ea 0%, #f472b6 100%)',
        'grad-cool':      'linear-gradient(135deg, #06b6d4 0%, #a855f7 100%)',
        'grad-glow':      'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.25) 0%, transparent 70%)',
        'grad-card':      'linear-gradient(145deg, rgba(17,24,39,0.95) 0%, rgba(7,11,20,0.98) 100%)',
        'grad-card-glow': 'linear-gradient(145deg, rgba(147,51,234,0.08) 0%, rgba(6,182,212,0.04) 100%)',
        'grad-mesh':      'radial-gradient(at 20% 20%, rgba(147,51,234,0.15) 0px, transparent 50%), radial-gradient(at 80% 10%, rgba(6,182,212,0.1) 0px, transparent 50%), radial-gradient(at 50% 80%, rgba(244,114,182,0.08) 0px, transparent 50%)',
        // Shimmer
        'shimmer':        'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)',
        'shimmer-color':  'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.15) 50%, transparent 100%)',
      },
      boxShadow: {
        // 3D depth shadows
        'card-3d':      '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        'card-3d-hover':'0 1px 0 0 rgba(255,255,255,0.08) inset, 0 28px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(168,85,247,0.25), 0 0 40px rgba(168,85,247,0.12)',
        'card-light':   '0 1px 0 rgba(255,255,255,0.8) inset, 0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
        'card-light-hover': '0 1px 0 rgba(255,255,255,0.9) inset, 0 12px 40px rgba(147,51,234,0.12), 0 0 0 1px rgba(147,51,234,0.15)',
        // Neon glows
        'neon-purple':  '0 0 20px rgba(168,85,247,0.5), 0 0 60px rgba(168,85,247,0.2)',
        'neon-cyan':    '0 0 20px rgba(6,182,212,0.5),  0 0 60px rgba(6,182,212,0.2)',
        'neon-pink':    '0 0 20px rgba(244,114,182,0.5),0 0 60px rgba(244,114,182,0.2)',
        'neon-sm':      '0 0 12px rgba(168,85,247,0.4)',
        // Buttons
        'btn-primary':  '0 4px 20px rgba(147,51,234,0.5), 0 1px 0 rgba(255,255,255,0.1) inset',
        'btn-primary-h':'0 8px 32px rgba(147,51,234,0.7), 0 1px 0 rgba(255,255,255,0.15) inset',
        // Input
        'input-focus':  '0 0 0 3px rgba(168,85,247,0.2), 0 0 20px rgba(168,85,247,0.08)',
        // General
        'glow':         '0 0 40px rgba(168,85,247,0.2)',
        'glow-lg':      '0 0 80px rgba(168,85,247,0.3)',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-up':     'slideUp 0.45s cubic-bezier(0.16,1,0.3,1)',
        'slide-right':  'slideRight 0.35s ease-out',
        'scale-in':     'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        'float':        'float 7s ease-in-out infinite',
        'shimmer':      'shimmer 2.5s linear infinite',
        'glow-pulse':   'glowPulse 3s ease-in-out infinite',
        'border-spin':  'borderSpin 4s linear infinite',
        'tilt':         'tilt 10s ease-in-out infinite',
        'orbit':        'orbit 20s linear infinite',
        'gradient-x':   'gradientX 8s ease infinite',
      },
      keyframes: {
        fadeIn:     { '0%': { opacity: '0' },                                            '100%': { opacity: '1' } },
        slideUp:    { '0%': { transform: 'translateY(20px)', opacity: '0' },             '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideRight: { '0%': { transform: 'translateX(-16px)', opacity: '0' },            '100%': { transform: 'translateX(0)', opacity: '1' } },
        scaleIn:    { '0%': { transform: 'scale(0.92)', opacity: '0' },                  '100%': { transform: 'scale(1)', opacity: '1' } },
        float:      { '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },         '50%': { transform: 'translateY(-14px) rotate(0.5deg)' } },
        shimmer:    { '0%': { backgroundPosition: '-200% 0' },                           '100%': { backgroundPosition: '200% 0' } },
        glowPulse:  { '0%,100%': { opacity: '0.6' },                                    '50%': { opacity: '1' } },
        borderSpin: { '0%': { backgroundPosition: '0% 50%' },                           '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
        tilt:       { '0%,100%': { transform: 'rotate(-1deg)' },                        '50%': { transform: 'rotate(1deg)' } },
        orbit:      { '0%': { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' }, '100%': { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' } },
        gradientX:  { '0%,100%': { backgroundPosition: '0% 50%' },                      '50%': { backgroundPosition: '100% 50%' } },
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
