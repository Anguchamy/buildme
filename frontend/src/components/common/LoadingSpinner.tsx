import { classNames } from '@/utils/helpers'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  className?: string
}

export default function LoadingSpinner({ size = 'md', fullScreen, className }: Props) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }

  const spinner = (
    <div
      className={classNames(
        sizes[size],
        'border-2 border-light-3 dark:border-surface-4 border-t-brand-500 rounded-full animate-spin',
        className
      )}
    />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-light-0 dark:bg-surface-0 flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}
