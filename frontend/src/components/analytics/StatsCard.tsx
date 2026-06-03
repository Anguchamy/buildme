interface Props {
  label: string
  value: string | number
  change?: number
  icon: string
  accent?: 'brand' | 'green' | 'blue' | 'orange'
}

const accentStyles: Record<string, { icon: string; glow: string; bar: string }> = {
  brand:  { icon: 'rgba(13,148,136,0.12)',  glow: 'rgba(13,148,136,0.2)',  bar: 'linear-gradient(to bottom, #0d9488, #06b6d4)' },
  green:  { icon: 'rgba(34,197,94,0.12)',   glow: 'rgba(34,197,94,0.18)',  bar: 'linear-gradient(to bottom, #22c55e, #4ade80)' },
  blue:   { icon: 'rgba(6,182,212,0.12)',   glow: 'rgba(6,182,212,0.18)',  bar: 'linear-gradient(to bottom, #06b6d4, #22d3ee)' },
  orange: { icon: 'rgba(245,158,11,0.12)',  glow: 'rgba(245,158,11,0.18)', bar: 'linear-gradient(to bottom, #f59e0b, #fbbf24)' },
}

const iconColor: Record<string, string> = {
  brand:  '#0d9488',
  green:  '#22c55e',
  blue:   '#06b6d4',
  orange: '#f59e0b',
}

export default function StatsCard({ label, value, change, icon, accent = 'brand' }: Props) {
  const style = accentStyles[accent]
  const color = iconColor[accent]

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 transition-all duration-250 cursor-default group"
      style={{
        background: 'white',
        border: `1px solid rgba(13,148,136,0.1)`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = `0 8px 28px ${style.glow}, 0 0 0 1px ${color}33`
        el.style.transform = 'translateY(-2px)'
        el.style.borderColor = `${color}30`
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'
        el.style.transform = ''
        el.style.borderColor = 'rgba(13,148,136,0.1)'
      }}
    >
      <style>{`
        html.dark .stats-card-inner {
          background: linear-gradient(145deg, rgba(15,27,45,0.98), rgba(10,18,32,0.98));
        }
      `}</style>

      {/* Dark mode override via absolute overlay */}
      <div
        className="stats-card-inner absolute inset-0 rounded-2xl opacity-0 dark:opacity-100 pointer-events-none"
        style={{ background: 'linear-gradient(145deg, rgba(15,27,45,0.98), rgba(10,18,32,0.98))' }}
      />

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
        style={{ background: style.bar }}
      />

      <div className="relative pl-2">
        {/* Icon + change badge row */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: style.icon }}
          >
            {icon}
          </div>
          {change !== undefined && (
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-lg"
              style={{
                color: change >= 0 ? '#22c55e' : '#ef4444',
                background: change >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              }}
            >
              {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
            </span>
          )}
        </div>

        {/* Value */}
        <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  )
}
