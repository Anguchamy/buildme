import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Analytics } from '@/types'
import { format, parseISO } from 'date-fns'

interface Props { data: Analytics[] }

export default function EngagementChart({ data }: Props) {
  const chartData = data.map((a) => ({
    date: format(parseISO(a.metricDate), 'MMM d'),
    likes: a.likes,
    comments: a.comments,
    shares: a.shares,
  }))

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Neon glow blob behind chart */}
      <div style={{
        position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '40%',
        background: 'radial-gradient(ellipse, rgba(168,85,247,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(20px)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 2 }}>Engagement Over Time</h3>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Likes, comments & shares per day</p>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-2)' }}>
          {[
            { color: '#a855f7', label: 'Likes' },
            { color: '#34d399', label: 'Comments' },
            { color: '#22d3ee', label: 'Shares' },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}` }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            {[
              { id: 'likesGrad',    color: '#a855f7' },
              { id: 'commentsGrad', color: '#34d399' },
              { id: 'sharesGrad',   color: '#22d3ee' },
            ].map(({ id, color }) => (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: 'var(--text-4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text-4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: 'rgba(12,18,33,0.95)',
              border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 20px rgba(168,85,247,0.1)',
              fontSize: 12,
              backdropFilter: 'blur(12px)',
            }}
            labelStyle={{ color: 'var(--text-2)', fontWeight: 700, marginBottom: 4 }}
            itemStyle={{ color: 'var(--text-2)' }}
          />
          <Area type="monotone" dataKey="likes"    stroke="#a855f7" strokeWidth={2} fill="url(#likesGrad)"    dot={false} activeDot={{ r: 5, fill: '#a855f7', strokeWidth: 0, filter: 'drop-shadow(0 0 6px #a855f7)' }} />
          <Area type="monotone" dataKey="comments" stroke="#34d399" strokeWidth={2} fill="url(#commentsGrad)" dot={false} activeDot={{ r: 5, fill: '#34d399', strokeWidth: 0, filter: 'drop-shadow(0 0 6px #34d399)' }} />
          <Area type="monotone" dataKey="shares"   stroke="#22d3ee" strokeWidth={2} fill="url(#sharesGrad)"   dot={false} activeDot={{ r: 5, fill: '#22d3ee', strokeWidth: 0, filter: 'drop-shadow(0 0 6px #22d3ee)' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
