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
  xs: 'px-2.5 py-1    text-xs  rounded-lg  gap-1.5',
  sm: 'px-3.5 py-1.5  text-xs  rounded-xl  gap-1.5',
  md: 'px-4.5 py-2    text-sm  rounded-xl  gap-2',
  lg: 'px-6   py-3    text-sm  rounded-2xl gap-2   font-semibold tracking-wide',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, style, glow, ...props }, ref) => {

    /* ── inline styles per variant ── */
    const inlineStyle: React.CSSProperties = {}

    if (variant === 'gradient' || variant === 'primary') {
      inlineStyle.background = 'linear-gradient(135deg, #9333ea 0%, #a855f7 50%, #06b6d4 100%)'
      inlineStyle.backgroundSize = '200% 200%'
      inlineStyle.boxShadow = '0 4px 20px rgba(147,51,234,0.5), inset 0 1px 0 rgba(255,255,255,0.12)'
    }
    if (variant === 'neon') {
      inlineStyle.background = 'transparent'
      inlineStyle.border = '1px solid rgba(168,85,247,0.5)'
      inlineStyle.boxShadow = '0 0 20px rgba(168,85,247,0.25), inset 0 0 20px rgba(168,85,247,0.05)'
      inlineStyle.color = '#c084fc'
    }
    if (variant === 'glass') {
      inlineStyle.background = 'rgba(255,255,255,0.05)'
      inlineStyle.backdropFilter = 'blur(16px)'
      inlineStyle.border = '1px solid rgba(255,255,255,0.08)'
      inlineStyle.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.06)'
    }
    if (variant === 'secondary') {
      inlineStyle.background = 'rgba(255,255,255,0.04)'
      inlineStyle.border = '1px solid rgba(255,255,255,0.1)'
    }
    if (variant === 'danger') {
      inlineStyle.background = 'rgba(239,68,68,0.08)'
      inlineStyle.border = '1px solid rgba(239,68,68,0.25)'
    }
    if (glow) {
      inlineStyle.boxShadow = (inlineStyle.boxShadow ?? '') + ', 0 0 40px rgba(168,85,247,0.3)'
    }

    /* ── className per variant ── */
    const variantClass: Record<string, string> = {
      primary:   'text-white hover:opacity-90 active:opacity-80 active:scale-[0.97]',
      gradient:  'text-white hover:opacity-90 active:opacity-80 active:scale-[0.97]',
      secondary: 'text-slate-200 hover:text-white hover:border-purple-500/30 hover:bg-white/8 active:scale-[0.97] dark:text-slate-300',
      ghost:     'text-slate-400 hover:text-white hover:bg-white/5 active:scale-[0.97]',
      neon:      'hover:shadow-neon-purple hover:border-purple-500/80 active:scale-[0.97]',
      glass:     'text-slate-200 hover:bg-white/8 hover:border-white/15 active:scale-[0.97]',
      danger:    'text-red-400 hover:text-red-300 hover:bg-red-500/12 active:scale-[0.97]',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{ ...inlineStyle, transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)', ...style }}
        className={classNames(
          'inline-flex items-center justify-center font-semibold relative overflow-hidden select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
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
