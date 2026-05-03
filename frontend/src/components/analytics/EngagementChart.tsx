import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Analytics } from '@/types'
import { format, parseISO } from 'date-fns'
import { useThemeStore } from '@/store/themeStore'

interface Props {
  data: Analytics[]
}

export default function EngagementChart({ data }: Props) {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  const chartData = data.map((a) => ({
    date: format(parseISO(a.metricDate), 'MMM d'),
    likes: a.likes,
    comments: a.comments,
    shares: a.shares,
  }))

  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
  const tickColor = isDark ? '#6b7280' : '#9ca3af'
  const tooltipBg = isDark ? '#1c1c30' : '#ffffff'
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Engagement Over Time</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block" /> Likes</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success-500 inline-block" /> Comments</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-500 inline-block" /> Shares</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="commentsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="sharesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
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
          <Area type="monotone" dataKey="likes" stroke="#8b5cf6" strokeWidth={2} fill="url(#likesGrad)" dot={false} />
          <Area type="monotone" dataKey="comments" stroke="#22c55e" strokeWidth={2} fill="url(#commentsGrad)" dot={false} />
          <Area type="monotone" dataKey="shares" stroke="#0ea5e9" strokeWidth={2} fill="url(#sharesGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
