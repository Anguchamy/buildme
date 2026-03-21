import { PostStatus, ScheduledPostStatus } from '@/types'
import { classNames } from '@/utils/helpers'

interface Props {
  status: PostStatus | ScheduledPostStatus | string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT:      { label: 'Draft',      className: 'bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400' },
  SCHEDULED:  { label: 'Scheduled',  className: 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' },
  PUBLISHED:  { label: 'Published',  className: 'bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400' },
  FAILED:     { label: 'Failed',     className: 'bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400' },
  ARCHIVED:   { label: 'Archived',   className: 'bg-gray-100 text-gray-400 dark:bg-gray-600/20 dark:text-gray-500' },
  PENDING:    { label: 'Pending',    className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
  PROCESSING: { label: 'Processing', className: 'bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400' },
  CANCELLED:  { label: 'Cancelled',  className: 'bg-gray-100 text-gray-400 dark:bg-gray-500/20 dark:text-gray-400' },
}

export default function StatusBadge({ status }: Props) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400' }
  return (
    <span className={classNames('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  )
}
