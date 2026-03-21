import { useState } from 'react'
import { format, subDays, subMonths } from 'date-fns'
import { useWorkspaceAnalytics } from '@/hooks/useAnalytics'
import StatsCard from '@/components/analytics/StatsCard'
import EngagementChart from '@/components/analytics/EngagementChart'
import PlatformBreakdown from '@/components/analytics/PlatformBreakdown'
import Button from '@/components/common/Button'

type Range = '7d' | '30d' | '90d'

export default function Analytics() {
  const [range, setRange] = useState<Range>('30d')

  const daysMap: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 }
  const from = format(subDays(new Date(), daysMap[range]), 'yyyy-MM-dd')
  const to = format(new Date(), 'yyyy-MM-dd')

  const { data: analytics = [], isLoading } = useWorkspaceAnalytics(from, to)

  const totals = analytics.reduce(
    (acc, a) => ({
      impressions: acc.impressions + a.impressions,
      likes: acc.likes + a.likes,
      comments: acc.comments + a.comments,
      shares: acc.shares + a.shares,
    }),
    { impressions: 0, likes: 0, comments: 0, shares: 0 }
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Track performance across all your platforms</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as Range[]).map((r) => (
            <Button
              key={r}
              variant={range === r ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setRange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Impressions" value={totals.impressions.toLocaleString()} icon="👁️" />
        <StatsCard label="Likes" value={totals.likes.toLocaleString()} icon="❤️" />
        <StatsCard label="Comments" value={totals.comments.toLocaleString()} icon="💬" />
        <StatsCard label="Shares" value={totals.shares.toLocaleString()} icon="🔄" />
      </div>

      {isLoading ? (
        <div className="h-56 bg-surface-2 rounded-xl animate-pulse" />
      ) : analytics.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EngagementChart data={analytics} />
          <PlatformBreakdown data={analytics} />
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-3xl mb-3">📊</p>
          <p className="text-gray-900 dark:text-white font-medium">No analytics data yet</p>
          <p className="text-gray-400 text-sm mt-1">Connect platforms and publish posts to see data</p>
        </div>
      )}
    </div>
  )
}
