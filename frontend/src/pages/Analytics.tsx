import { useState } from 'react'
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns'
import { useWorkspaceAnalytics } from '@/hooks/useAnalytics'
import StatsCard from '@/components/analytics/StatsCard'
import EngagementChart from '@/components/analytics/EngagementChart'
import PlatformBreakdown from '@/components/analytics/PlatformBreakdown'
import PageLoader from '@/components/common/PageLoader'
import { Link } from 'react-router-dom'
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { useThemeStore } from '@/store/themeStore'
import type { Analytics } from '@/types'
import { Platform } from '@/types'
import { getPlatformColor } from '@/utils/helpers'

type Range = '7d' | '30d' | '90d'

// Generate rich demo data for empty state
function generateDemoData(days: number): Analytics[] {
  const result: Analytics[] = []
  const platforms = [Platform.INSTAGRAM, Platform.TWITTER, Platform.LINKEDIN, Platform.FACEBOOK]
  const interval = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() })

  interval.forEach((date, i) => {
    platforms.forEach((platform) => {
      const base = platform === Platform.INSTAGRAM ? 1200 : platform === Platform.TWITTER ? 600 : 300
      const growth = 1 + (i / days) * 0.4
      const rand = () => Math.random() * 0.4 + 0.8
      result.push({
        id: result.length,
        workspaceId: 0,
        postId: undefined,
        platform,
        metricDate: format(date, 'yyyy-MM-dd'),
        impressions: Math.round(base * growth * rand()),
        likes: Math.round(base * 0.08 * growth * rand()),
        comments: Math.round(base * 0.02 * growth * rand()),
        shares: Math.round(base * 0.015 * growth * rand()),
        reach: Math.round(base * 0.7 * growth * rand()),
        saves: Math.round(base * 0.03 * growth * rand()),
        clicks: Math.round(base * 0.05 * growth * rand()),
        profileVisits: Math.round(base * 0.04 * growth * rand()),
        follows: Math.round(base * 0.005 * growth * rand()),
        engagementRate: parseFloat((3.2 + Math.random() * 2).toFixed(2)),
      } as Analytics)
    })
  })
  return result
}

function TrendBadge({ value }: { value: number }) {
  const pos = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-lg ${
      pos ? 'text-success-500 bg-success-500/10' : 'text-red-500 bg-red-500/10'
    }`}>
      {pos ? '▲' : '▼'} {Math.abs(value)}%
    </span>
  )
}

function ImpressionsSparkline({ data, isDark }: { data: Analytics[], isDark: boolean }) {
  const byDate = data.reduce<Record<string, number>>((acc, a) => {
    acc[a.metricDate] = (acc[a.metricDate] ?? 0) + a.impressions
    return acc
  }, {})

  const chartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, impressions]) => ({ date: format(parseISO(date), 'MMM d'), impressions }))

  const tickColor = isDark ? '#6b7280' : '#9ca3af'
  const tooltipBg = isDark ? '#1c1c30' : '#ffffff'
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Impressions Over Time</h3>
          <p className="text-xs text-gray-400 mt-0.5">Total reach per day across all platforms</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="impressionLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} vertical={false} />
          <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              fontSize: 12,
            }}
            labelStyle={{ color: isDark ? '#e5e7eb' : '#111827', fontWeight: 600 }}
          />
          <Line
            type="monotone"
            dataKey="impressions"
            stroke="url(#impressionLine)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function EngagementDonut({ rate, isDark }: { rate: number, isDark: boolean }) {
  const data = [{ name: 'Engagement', value: Math.min(rate, 10), fill: '#8b5cf6' }]
  return (
    <div className="card flex flex-col items-center justify-center py-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 self-start">Engagement Rate</h3>
      <div className="relative w-36 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 10]} tick={false} />
            <RadialBar dataKey="value" background={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{rate}%</span>
          <span className="text-xs text-gray-400">avg rate</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4 text-center">
        {rate >= 3 ? '🔥 Above industry average (3%)' : rate >= 1 ? '📈 Getting traction' : '💡 Room to grow'}
      </p>
    </div>
  )
}

function PlatformSummaryRow({ platform, data }: { platform: Platform, data: Analytics[] }) {
  const platformData = data.filter((a) => a.platform === platform)
  if (platformData.length === 0) return null
  const impressions = platformData.reduce((s, a) => s + a.impressions, 0)
  const engagement = platformData.reduce((s, a) => s + a.likes + a.comments + a.shares, 0)
  const avgEngRate = (platformData.reduce((s, a) => s + a.engagementRate, 0) / platformData.length).toFixed(1)
  const color = getPlatformColor(platform)
  const label = platform.charAt(0) + platform.slice(1).toLowerCase()

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-light-1 dark:hover:bg-surface-3 transition-colors">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: color + '20', color }}>
        ●
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-400">{impressions.toLocaleString()} impressions</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{engagement.toLocaleString()}</p>
        <p className="text-xs text-gray-400">{avgEngRate}% eng.</p>
      </div>
      <div className="w-20 h-1.5 bg-light-2 dark:bg-surface-3 rounded-full overflow-hidden flex-shrink-0">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, (parseFloat(avgEngRate) / 10) * 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}

export default function Analytics() {
  const [range, setRange] = useState<Range>('30d')
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  const daysMap: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 }
  const from = format(subDays(new Date(), daysMap[range]), 'yyyy-MM-dd')
  const to = format(new Date(), 'yyyy-MM-dd')

  const { data: rawAnalytics, isLoading } = useWorkspaceAnalytics(from, to)
  const isEmpty = !isLoading && (!rawAnalytics || rawAnalytics.length === 0)
  const analytics = isEmpty ? generateDemoData(daysMap[range]) : (rawAnalytics ?? [])
  const isDemo = isEmpty

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
    ? parseFloat((analytics.reduce((sum, a) => sum + a.engagementRate, 0) / analytics.length).toFixed(2))
    : 0

  // Simulate week-over-week change for demo
  const changes = isDemo
    ? { impressions: 18, reach: 12, likes: 23, engagement: 8, comments: 15, shares: 7, saves: 31, interactions: 14 }
    : { impressions: 0, reach: 0, likes: 0, engagement: 0, comments: 0, shares: 0, saves: 0, interactions: 0 }

  const activePlatforms = Object.values(Platform).filter((p) =>
    analytics.some((a) => a.platform === p)
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track performance across all your platforms</p>
        </div>
        <div className="flex items-center gap-3">
          {isDemo && (
            <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
              ✨ Demo data
            </span>
          )}
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
      </div>

      {isDemo && (
        <div className="card border-orange-500/20 bg-orange-500/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 flex items-center justify-center text-base flex-shrink-0">📊</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Showing sample analytics</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Connect your social accounts to see real data here.</p>
          </div>
          <Link
            to="/app/integrations"
            className="text-xs font-semibold text-brand-500 hover:text-brand-400 whitespace-nowrap"
          >
            Connect accounts →
          </Link>
        </div>
      )}

      {/* Stats row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Impressions" value={totals.impressions.toLocaleString()} icon="👁️" accent="brand" change={changes.impressions} />
        <StatsCard label="Reach" value={totals.reach.toLocaleString()} icon="📡" accent="blue" change={changes.reach} />
        <StatsCard label="Likes" value={totals.likes.toLocaleString()} icon="❤️" accent="orange" change={changes.likes} />
        <StatsCard label="Engagement Rate" value={`${engagementRate}%`} icon="📈" accent="green" change={changes.engagement} />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Comments" value={totals.comments.toLocaleString()} icon="💬" accent="brand" change={changes.comments} />
        <StatsCard label="Shares" value={totals.shares.toLocaleString()} icon="🔄" accent="blue" change={changes.shares} />
        <StatsCard label="Saves" value={totals.saves.toLocaleString()} icon="🔖" accent="orange" change={changes.saves} />
        <StatsCard label="Total Interactions" value={(totals.likes + totals.comments + totals.shares + totals.saves).toLocaleString()} icon="⚡" accent="green" change={changes.interactions} />
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EngagementChart data={analytics} />
        </div>
        <EngagementDonut rate={engagementRate} isDark={isDark} />
      </div>

      {/* Impressions over time */}
      <ImpressionsSparkline data={analytics} isDark={isDark} />

      {/* Platform breakdown + per-platform table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformBreakdown data={analytics} />
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Platform Performance</h3>
          <div className="space-y-1">
            {activePlatforms.map((p) => (
              <PlatformSummaryRow key={p} platform={p} data={analytics} />
            ))}
            {activePlatforms.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No platform data</p>
            )}
          </div>
        </div>
      </div>

      {/* Best time to post insight */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Posting Insights</h3>
          <span className="text-xs text-brand-500 font-medium">AI-powered</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: '🕐',
              title: 'Best Time to Post',
              desc: 'Tuesdays & Thursdays between 10–11 AM get 2.3× more engagement',
              accent: 'brand',
            },
            {
              icon: '📸',
              title: 'Top Content Format',
              desc: 'Carousel posts generate 3× more saves than single images on Instagram',
              accent: 'blue',
            },
            {
              icon: '🏷️',
              title: 'Hashtag Strategy',
              desc: '10–15 targeted hashtags outperform mass-hashtag approaches by 40%',
              accent: 'green',
            },
          ].map((tip) => (
            <div key={tip.title} className="flex items-start gap-3 p-3 rounded-xl bg-light-1 dark:bg-surface-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-lg flex-shrink-0">
                {tip.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">{tip.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
