import { ButtonHTMLAttributes, forwardRef } from 'react'
import { classNames } from '@/utils/helpers'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient' | 'teal-glass'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variants: Record<string, string> = {
  // Solid teal with shimmer sweep on hover
  primary: [
    'relative overflow-hidden',
    'bg-brand-600 hover:bg-brand-500 active:bg-brand-700',
    'text-white shadow-brand',
    'hover:shadow-brand-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.98]',
    'after:absolute after:inset-0 after:bg-shimmer after:bg-[length:200%_100%]',
    'hover:after:animate-shimmer',
    'transition-all duration-200',
  ].join(' '),

  // Teal → Cyan gradient with glow + shimmer
  gradient: [
    'relative overflow-hidden',
    'text-white',
    'shadow-brand hover:shadow-brand-lg',
    'hover:-translate-y-px active:translate-y-0 active:scale-[0.98]',
    'transition-all duration-200',
    'after:absolute after:inset-0 after:bg-shimmer after:bg-[length:200%_100%]',
    'hover:after:animate-shimmer',
  ].join(' '),

  // Glass secondary — teal-tinted border
  secondary: [
    'relative',
    'bg-white dark:bg-surface-3',
    'text-gray-700 dark:text-white',
    'border border-light-3 dark:border-white/10',
    'hover:border-brand-500/40 dark:hover:border-brand-500/30',
    'hover:bg-light-2 dark:hover:bg-surface-4',
    'hover:text-brand-700 dark:hover:text-brand-400',
    'active:scale-[0.98]',
    'transition-all duration-200',
  ].join(' '),

  // Ghost
  ghost: [
    'bg-transparent',
    'text-gray-500 dark:text-gray-400',
    'hover:bg-brand-500/8 hover:text-brand-700 dark:hover:bg-brand-500/10 dark:hover:text-brand-400',
    'active:scale-[0.98]',
    'transition-all duration-150',
  ].join(' '),

  // Danger
  danger: [
    'bg-red-50 dark:bg-red-500/10',
    'text-red-600 dark:text-red-400',
    'border border-red-200 dark:border-red-500/20',
    'hover:bg-red-100 dark:hover:bg-red-500/20',
    'active:scale-[0.98]',
    'transition-all duration-150',
  ].join(' '),

  // Glass teal — frosted + glowing border
  'teal-glass': [
    'relative',
    'backdrop-blur-md',
    'text-brand-600 dark:text-brand-400',
    'border border-brand-500/30 dark:border-brand-500/25',
    'hover:border-brand-500/60 dark:hover:border-brand-500/50',
    'hover:shadow-glow',
    'active:scale-[0.98]',
    'transition-all duration-200',
  ].join(' '),
}

// Gradient background applied inline so it can animate
const gradientStyle = 'linear-gradient(135deg, #0d9488 0%, #06b6d4 60%, #0891b2 100%)'
const tealGlassStyle = 'rgba(13,148,136,0.06)'

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-sm rounded-2xl gap-2 font-semibold',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, style, ...props }, ref) => {
    const isGradient = variant === 'gradient'
    const isGlass = variant === 'teal-glass'

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{
          ...(isGradient ? { background: gradientStyle } : {}),
          ...(isGlass ? { background: tealGlassStyle } : {}),
          ...style,
        }}
        className={classNames(
          'inline-flex items-center font-semibold',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'select-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : leftIcon}
        <span className="relative z-10">{children}</span>
        {rightIcon && <span className="relative z-10">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
