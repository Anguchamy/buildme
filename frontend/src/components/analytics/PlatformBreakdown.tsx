import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { Analytics, Platform } from '@/types'
import { getPlatformColor } from '@/utils/helpers'

interface Props { data: Analytics[] }

export default function PlatformBreakdown({ data }: Props) {
  const aggregated = Object.values(Platform).map((platform) => {
    const pd = data.filter((a) => a.platform === platform)
    const total = pd.reduce((s, a) => s + a.likes + a.comments + a.shares, 0)
    return { platform, total }
  }).filter((d) => d.total > 0)

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '50%', background: 'radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(20px)' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>Platform Breakdown</h3>
          <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>Total interactions by platform</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={aggregated} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="platform"
            tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 10 }}
            axisLine={false} tickLine={false}
            tickFormatter={(v) => v.charAt(0) + v.slice(1).toLowerCase().slice(0, 4)}
          />
          <YAxis tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: 'rgba(12,18,33,0.95)',
              border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              fontSize: 12,
              backdropFilter: 'blur(12px)',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
            cursor={{ fill: 'rgba(168,85,247,0.05)' }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {aggregated.map((entry) => (
              <Cell
                key={entry.platform}
                fill={getPlatformColor(entry.platform)}
                style={{ filter: `drop-shadow(0 0 6px ${getPlatformColor(entry.platform)}80)` }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
