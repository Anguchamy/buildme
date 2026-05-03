import { ButtonHTMLAttributes, forwardRef } from 'react'
import { classNames } from '@/utils/helpers'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variants = {
  primary: 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-sm hover:shadow-brand active:scale-[0.98]',
  gradient: 'bg-gradient-to-r from-brand-500 via-brand-600 to-accent-500 hover:opacity-90 text-white shadow-sm hover:shadow-brand active:scale-[0.98]',
  secondary: 'bg-light-2 hover:bg-light-3 text-gray-700 border border-light-3 dark:bg-surface-3 dark:hover:bg-surface-4 dark:text-white dark:border-white/10 active:scale-[0.98]',
  ghost: 'bg-transparent hover:bg-light-2 text-gray-600 dark:hover:bg-surface-3 dark:text-gray-400 dark:hover:text-white active:scale-[0.98]',
  danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:border-red-500/20 active:scale-[0.98]',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-lg',
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-2.5 text-sm rounded-xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classNames(
          'inline-flex items-center gap-2 font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 select-none',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
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
        {children}
        {rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
