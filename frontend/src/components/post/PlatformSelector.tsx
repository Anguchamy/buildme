import { Platform } from '@/types'
import { getPlatformColor, getPlatformIcon } from '@/utils/helpers'
import { classNames } from '@/utils/helpers'

interface Props {
  selected: Platform[]
  onChange: (platforms: Platform[]) => void
}

const platforms = Object.values(Platform)

export default function PlatformSelector({ selected, onChange }: Props) {
  const toggle = (p: Platform) => {
    if (selected.includes(p)) {
      onChange(selected.filter((s) => s !== p))
    } else {
      onChange([...selected, p])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((p) => {
        const active = selected.includes(p)
        return (
          <button
            key={p}
            type="button"
            onClick={() => toggle(p)}
            className={classNames(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
              active
                ? 'text-white border-transparent'
                : 'bg-surface-3 text-gray-400 border-white/10 hover:border-white/20'
            )}
            style={active ? { backgroundColor: getPlatformColor(p), borderColor: getPlatformColor(p) } : {}}
          >
            <span>{getPlatformIcon(p)}</span>
            {p.charAt(0) + p.slice(1).toLowerCase()}
          </button>
        )
      })}
    </div>
  )
}
