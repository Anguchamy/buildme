import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Analytics, Platform } from '@/types'
import { getPlatformColor } from '@/utils/helpers'

interface Props {
  data: Analytics[]
}

export default function PlatformBreakdown({ data }: Props) {
  const aggregated = Object.values(Platform).map((platform) => {
    const platformData = data.filter((a) => a.platform === platform)
    const total = platformData.reduce((sum, a) => sum + a.likes + a.comments + a.shares, 0)
    return { platform, total }
  }).filter((d) => d.total > 0)

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-gray-300 mb-4">Platform Breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={aggregated}>
          <XAxis dataKey="platform" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #ffffff10', borderRadius: 8 }}
            labelStyle={{ color: '#fff' }}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {aggregated.map((entry) => (
              <Cell key={entry.platform} fill={getPlatformColor(entry.platform)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
