import { Platform } from '@/types'
import { getPlatformColor, getPlatformIcon } from '@/utils/helpers'
import { classNames } from '@/utils/helpers'

interface Props {
  platform: Platform | string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' }

export default function PlatformIcon({ platform, size = 'md', showLabel, className }: Props) {
  return (
    <div className={classNames('inline-flex items-center gap-1.5', className)}>
      <div
        className={classNames(
          sizes[size],
          'rounded-full flex items-center justify-center font-bold',
        )}
        style={{ backgroundColor: getPlatformColor(platform) + '30', color: getPlatformColor(platform) }}
        title={platform}
      >
        {getPlatformIcon(platform)}
      </div>
      {showLabel && (
        <span className="text-xs text-gray-300 capitalize">{platform.toLowerCase()}</span>
      )}
    </div>
  )
}
