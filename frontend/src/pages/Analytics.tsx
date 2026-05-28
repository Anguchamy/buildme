import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { useWorkspaceAnalytics } from '@/hooks/useAnalytics'
import StatsCard from '@/components/analytics/StatsCard'
import EngagementChart from '@/components/analytics/EngagementChart'
import PlatformBreakdown from '@/components/analytics/PlatformBreakdown'
import Button from '@/components/common/Button'
import PageLoader from '@/components/common/PageLoader'

type Range = '7d' | '30d' | '90d'

export default function Analytics() {
  const [range, setRange] = useState<Range>('30d')

  const daysMap: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 }
  const from = format(subDays(new Date(), daysMap[range]), 'yyyy-MM-dd')
  const to = format(new Date(), 'yyyy-MM-dd')

  const { data: analytics = [], isLoading } = useWorkspaceAnalytics(from, to)

  if (isLoading) return <PageLoader />

  const totals = analytics.reduce(
    (acc, a) => ({
      impressions: acc.impressions + a.impressions,
      likes: acc.likes + a.likes,
      comments: acc.comments + a.comments,
      shares: acc.shares + a.shares,
      reach: acc.reach + a.reach,
      saves: acc.saves + a.saves,
    }),
    { impressions: 0, likes: 0, comments: 0, shares: 0, reach: 0, saves: 0 }
  )

  const engagementRate = analytics.length > 0
    ? (analytics.reduce((sum, a) => sum + a.engagementRate, 0) / analytics.length).toFixed(2)
    : '0.00'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track performance across all your platforms</p>
        </div>
        <div className="flex bg-light-2 dark:bg-surface-2 rounded-xl p-1 gap-1">
          {(['7d', '30d', '90d'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                range === r
                  ? 'bg-white dark:bg-surface-4 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Impressions" value={totals.impressions.toLocaleString()} icon="👁️" accent="brand" />
        <StatsCard label="Reach" value={totals.reach.toLocaleString()} icon="📡" accent="blue" />
        <StatsCard label="Likes" value={totals.likes.toLocaleString()} icon="❤️" accent="orange" />
        <StatsCard label="Engagement Rate" value={`${engagementRate}%`} icon="📈" accent="green" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Comments" value={totals.comments.toLocaleString()} icon="💬" accent="brand" />
        <StatsCard label="Shares" value={totals.shares.toLocaleString()} icon="🔄" accent="blue" />
        <StatsCard label="Saves" value={totals.saves.toLocaleString()} icon="🔖" accent="orange" />
        <StatsCard label="Total Interactions" value={(totals.likes + totals.comments + totals.shares + totals.saves).toLocaleString()} icon="⚡" accent="green" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card h-64 animate-pulse bg-light-2 dark:bg-surface-2" />
          <div className="card h-64 animate-pulse bg-light-2 dark:bg-surface-2" />
        </div>
      ) : analytics.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EngagementChart data={analytics} />
          <PlatformBreakdown data={analytics} />
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📊</div>
          <p className="text-gray-900 dark:text-white font-semibold text-lg">No analytics data yet</p>
          <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">
            Connect your social accounts and publish posts to start seeing analytics data here.
          </p>
          <Button variant="gradient" className="mt-6">Connect Platforms</Button>
        </div>
      )}
    </div>
  )
}
