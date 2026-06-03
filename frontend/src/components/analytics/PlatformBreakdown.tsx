import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Analytics, Platform } from '@/types'
import { getPlatformColor } from '@/utils/helpers'
import { useThemeStore } from '@/store/themeStore'

interface Props {
  data: Analytics[]
}

export default function PlatformBreakdown({ data }: Props) {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  const aggregated = Object.values(Platform).map((platform) => {
    const platformData = data.filter((a) => a.platform === platform)
    const total = platformData.reduce((sum, a) => sum + a.likes + a.comments + a.shares, 0)
    return { platform, total }
  }).filter((d) => d.total > 0)

  const tickColor = isDark ? '#6b7280' : '#9ca3af'
  const tooltipBg = isDark ? '#1c1c30' : '#ffffff'
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Platform Breakdown</h3>
        <span className="text-xs text-gray-400">Total interactions</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={aggregated} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="platform"
            tick={{ fill: tickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.charAt(0) + v.slice(1).toLowerCase().slice(0, 4)}
          />
          <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              fontSize: 12,
            }}
            labelStyle={{ color: isDark ? '#e5e7eb' : '#111827', fontWeight: 600, marginBottom: 4 }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {aggregated.map((entry) => (
              <Cell key={entry.platform} fill={getPlatformColor(entry.platform)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
