import { useAuthStore } from '@/store/authStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { usePostsQuery } from '@/hooks/usePosts'
import { useWorkspaceAnalytics } from '@/hooks/useAnalytics'
import StatsCard from '@/components/analytics/StatsCard'
import PostCard from '@/components/post/PostCard'
import { Platform, PostStatus } from '@/types'
import { usePostStore } from '@/store/postStore'
import Button from '@/components/common/Button'
import { format, subDays } from 'date-fns'
import { getPlatformColor, getPlatformIcon } from '@/utils/helpers'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const { currentWorkspaceId, workspaces } = useWorkspaceStore()
  const workspace = workspaces.find((w) => w.id === currentWorkspaceId)
  const { data: posts = [] } = usePostsQuery()
  const { data: analytics = [] } = useWorkspaceAnalytics(
    format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    format(new Date(), 'yyyy-MM-dd')
  )
  const openComposer = usePostStore((s) => s.openComposer)

  const totalImpressions = analytics.reduce((sum, a) => sum + a.impressions, 0)
  const totalEngagement = analytics.reduce((sum, a) => sum + a.likes + a.comments + a.shares, 0)
  const scheduledCount = posts.filter((p) => p.status === PostStatus.SCHEDULED).length
  const publishedCount = posts.filter((p) => p.status === PostStatus.PUBLISHED).length
  const draftCount = posts.filter((p) => p.status === PostStatus.DRAFT).length

  const recentPosts = posts.slice(0, 6)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Platform activity
  const platformActivity = Object.values(Platform).map((p) => {
    const count = posts.filter((post) => post.platforms.includes(p)).length
    return { platform: p, count }
  }).filter((p) => p.count > 0).sort((a, b) => b.count - a.count).slice(0, 4)

  const upcomingPosts = posts
    .filter((p) => p.status === PostStatus.SCHEDULED && p.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {greeting}, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {workspace ? workspace.name : 'Select a workspace'} &middot; {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <Button variant="gradient" onClick={() => openComposer()} leftIcon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        }>
          New Post
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Posts" value={posts.length} icon="📝" accent="brand" />
        <StatsCard label="Scheduled" value={scheduledCount} icon="📅" accent="blue" />
        <StatsCard label="Published" value={publishedCount} icon="✅" accent="green" />
        <StatsCard label="Impressions (30d)" value={totalImpressions.toLocaleString()} icon="👁️" accent="orange" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent posts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Posts</h2>
            <Link to="/app/calendar">
              <Button variant="ghost" size="xs">View calendar</Button>
            </Link>
          </div>

          {recentPosts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} onClick={() => openComposer(post.id)} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-14">
              <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">✏️</div>
              <p className="text-gray-900 dark:text-white font-semibold mb-1">No posts yet</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">Create your first post to get started</p>
              <Button variant="gradient" onClick={() => openComposer()}>Create your first post</Button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick stats */}
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Activity Summary</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Drafts', value: draftCount, color: 'bg-gray-400' },
                { label: 'Scheduled', value: scheduledCount, color: 'bg-brand-500' },
                { label: 'Published', value: publishedCount, color: 'bg-success-500' },
                { label: 'Engagement', value: totalEngagement.toLocaleString(), color: 'bg-accent-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform breakdown */}
          {platformActivity.length > 0 && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Active Platforms</h3>
              <div className="space-y-2.5">
                {platformActivity.map(({ platform, count }) => (
                  <div key={platform} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                        style={{ backgroundColor: getPlatformColor(platform as Platform) + '20' }}
                      >
                        {getPlatformIcon(platform as Platform)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300 capitalize text-xs">
                        {platform.charAt(0) + platform.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white tabular-nums text-xs">
                      {count} posts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming scheduled */}
          {upcomingPosts.length > 0 && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Upcoming</h3>
              <div className="space-y-2">
                {upcomingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-light-1 dark:hover:bg-surface-3 cursor-pointer transition-colors"
                    onClick={() => openComposer(post.id)}
                  >
                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                        {post.caption?.slice(0, 50) ?? 'No caption'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {format(new Date(post.scheduledAt!), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'New Post', to: '/app/compose', icon: '✏️' },
                { label: 'Calendar', to: '/app/calendar', icon: '📅' },
                { label: 'Media', to: '/app/media', icon: '🖼️' },
                { label: 'Analytics', to: '/app/analytics', icon: '📊' },
              ].map((a) => (
                <Link
                  key={a.label}
                  to={a.to}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-light-1 dark:bg-surface-3 hover:bg-light-2 dark:hover:bg-surface-4 transition-colors text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  <span>{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
