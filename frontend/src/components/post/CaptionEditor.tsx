import { Platform } from '@/types'
import { getPlatformCharLimit } from '@/utils/helpers'
import { classNames } from '@/utils/helpers'

interface Props {
  value: string
  onChange: (value: string) => void
  activePlatforms: Platform[]
  onGenerateAI?: () => void
}

export default function CaptionEditor({ value, onChange, activePlatforms, onGenerateAI }: Props) {
  const limit = activePlatforms.length > 0
    ? Math.min(...activePlatforms.map((p) => getPlatformCharLimit(p)))
    : 2200

  const remaining = limit - value.length
  const isOverLimit = remaining < 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label">Caption</label>
        {onGenerateAI && (
          <button
            type="button"
            onClick={onGenerateAI}
            className="text-xs text-brand-400 hover:text-brand-400 flex items-center gap-1"
          >
            ✨ Generate with AI
          </button>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Write your caption here..."
        className={classNames(
          'input resize-none',
          isOverLimit ? 'border-red-500/50 focus:ring-red-500' : ''
        )}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {activePlatforms.length > 0
            ? `Limit based on ${activePlatforms.join(', ')}`
            : 'Select platforms to see character limit'}
        </p>
        <span className={classNames('text-xs', isOverLimit ? 'text-red-400' : 'text-gray-500')}>
          {remaining.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
