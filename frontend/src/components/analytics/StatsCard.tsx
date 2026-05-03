interface Props {
  label: string
  value: string | number
  change?: number
  icon: string
  accent?: 'brand' | 'green' | 'blue' | 'orange'
}

const accentMap = {
  brand: { icon: 'bg-brand-500/10 text-brand-500 dark:bg-brand-500/15', border: 'border-brand-500/10' },
  green: { icon: 'bg-success-500/10 text-success-500 dark:bg-success-500/15', border: 'border-success-500/10' },
  blue: { icon: 'bg-accent-500/10 text-accent-500 dark:bg-accent-500/15', border: 'border-accent-500/10' },
  orange: { icon: 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/15', border: 'border-orange-500/10' },
}

export default function StatsCard({ label, value, change, icon, accent = 'brand' }: Props) {
  const colors = accentMap[accent]

  return (
    <div className="card relative overflow-hidden hover:shadow-md dark:hover:shadow-card-dark transition-shadow duration-300 group">
      {/* Subtle gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/3 to-transparent pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl ${colors.icon} flex items-center justify-center text-lg border ${colors.border}`}>
            {icon}
          </div>
          {change !== undefined && (
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-lg ${
              change >= 0
                ? 'text-success-500 bg-success-500/10'
                : 'text-red-500 bg-red-500/10'
            }`}>
              {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  )
}
