import { useAuthStore } from '@/store/authStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { usePostsQuery } from '@/hooks/usePosts'
import { useWorkspaceAnalytics } from '@/hooks/useAnalytics'
import StatsCard from '@/components/analytics/StatsCard'
import PostCard from '@/components/post/PostCard'
import { PostStatus } from '@/types'
import { usePostStore } from '@/store/postStore'
import Button from '@/components/common/Button'
import { format, subDays } from 'date-fns'

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

  const recentPosts = posts.slice(0, 6)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {workspace ? workspace.name : 'Select a workspace to get started'}
          </p>
        </div>
        <Button onClick={() => openComposer()}>✏️ New Post</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Posts" value={posts.length} icon="📝" />
        <StatsCard label="Scheduled" value={scheduledCount} icon="📅" />
        <StatsCard label="Published" value={publishedCount} icon="✅" />
        <StatsCard label="Impressions (30d)" value={totalImpressions.toLocaleString()} icon="👁️" />
      </div>

      {/* Recent Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Posts</h2>
          <Button variant="ghost" size="sm">View all</Button>
        </div>
        {recentPosts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} onClick={() => openComposer(post.id)} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-3xl mb-3">✏️</p>
            <p className="text-gray-900 dark:text-white font-medium mb-1">No posts yet</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Create your first post to get started</p>
            <Button onClick={() => openComposer()}>Create Post</Button>
          </div>
        )}
      </div>
    </div>
  )
}
