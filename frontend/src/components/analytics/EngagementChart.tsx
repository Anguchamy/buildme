import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Analytics } from '@/types'
import { format, parseISO } from 'date-fns'

interface Props {
  data: Analytics[]
}

export default function EngagementChart({ data }: Props) {
  const chartData = data.map((a) => ({
    date: format(parseISO(a.metricDate), 'MMM d'),
    likes: a.likes,
    comments: a.comments,
    shares: a.shares,
    impressions: a.impressions,
  }))

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-gray-300 mb-4">Engagement Over Time</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #ffffff10', borderRadius: 8 }}
            labelStyle={{ color: '#fff' }}
          />
          <Line type="monotone" dataKey="likes" stroke="#5c6ef5" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="comments" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="shares" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
