import { ButtonHTMLAttributes, forwardRef } from 'react'
import { classNames } from '@/utils/helpers'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient' | 'neon' | 'glass'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  glow?: boolean
}

const sizes = {
  xs: 'px-2.5 py-1   text-xs rounded-lg  gap-1.5',
  sm: 'px-3.5 py-1.5 text-xs rounded-xl  gap-1.5',
  md: 'px-4   py-2   text-sm rounded-xl  gap-2',
  lg: 'px-6   py-3   text-sm rounded-2xl gap-2 font-semibold tracking-wide',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, style, glow, ...props }, ref) => {

    /* ── inline styles per variant ── */
    const inlineStyle: React.CSSProperties = {}

    if (variant === 'gradient' || variant === 'primary') {
      inlineStyle.background = '#1C1AFF'
      inlineStyle.boxShadow = '0 2px 8px rgba(28,26,255,0.30), inset 0 1px 0 rgba(255,255,255,0.15)'
      inlineStyle.color = '#ffffff'
    }
    if (variant === 'neon') {
      inlineStyle.background = 'transparent'
      inlineStyle.border = '1px solid rgba(28,26,255,0.5)'
      inlineStyle.boxShadow = '0 2px 8px rgba(28,26,255,0.15)'
      inlineStyle.color = '#1d4ed8'
    }
    if (glow) {
      inlineStyle.boxShadow = (inlineStyle.boxShadow ?? '') + ', 0 4px 20px rgba(28,26,255,0.25)'
    }

    /* ── className per variant — uses .btn-* CSS classes for theme-aware bg/text ── */
    const variantClass: Record<string, string> = {
      primary:   'hover:opacity-90 active:opacity-80 active:scale-[0.97]',
      gradient:  'hover:opacity-90 active:opacity-80 active:scale-[0.97]',
      secondary: 'btn-secondary active:scale-[0.97]',
      ghost:     'btn-ghost active:scale-[0.97]',
      neon:      'hover:bg-brand-50 hover:border-brand-600 active:scale-[0.97]',
      glass:     'btn-glass active:scale-[0.97]',
      danger:    'btn-danger active:scale-[0.97]',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{ ...inlineStyle, transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)', ...style }}
        className={classNames(
          'inline-flex items-center justify-center font-semibold relative overflow-hidden select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClass[variant] ?? '',
          sizes[size],
          className
        )}
        {...props}
      >
        {/* Shimmer layer (gradient/primary only) */}
        {(variant === 'gradient' || variant === 'primary') && (
          <span
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s linear infinite',
            }}
          />
        )}

        {/* Top sheen for 3D lit effect */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
        />

        {loading ? (
          <svg className="animate-spin h-3.5 w-3.5 shrink-0 relative z-10" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : (
          leftIcon && <span className="relative z-10 shrink-0">{leftIcon}</span>
        )}

        <span className="relative z-10">{children}</span>

        {rightIcon && <span className="relative z-10 shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
