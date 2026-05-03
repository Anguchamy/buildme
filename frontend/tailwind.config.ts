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
        // Primary brand — Violet/Purple gradient feel
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',   // primary — violet-500
          600: '#7c3aed',   // hover
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Accent — electric blue
        accent: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        // Success green
        success: {
          400: '#4ade80',
          500: '#22c55e',
        },
        // Dark mode surfaces — deep navy
        surface: {
          0: '#080812',
          1: '#0e0e1a',
          2: '#151525',
          3: '#1c1c30',
          4: '#24243c',
          5: '#2d2d4a',
        },
        // Light mode surfaces
        light: {
          0: '#ffffff',
          1: '#f8f7ff',
          2: '#f1efff',
          3: '#e4e0fc',
          4: '#cbc5f5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #0ea5e9 100%)',
        'gradient-dark': 'linear-gradient(135deg, #080812 0%, #0e0e1a 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.05) 100%)',
        'gradient-glow': 'radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'brand': '0 0 20px rgba(139, 92, 246, 0.3)',
        'brand-lg': '0 0 40px rgba(139, 92, 246, 0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.08)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.4)',
        'glow': '0 0 30px rgba(139,92,246,0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config
