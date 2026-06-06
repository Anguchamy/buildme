import { useAuthStore } from '@/store/authStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { usePostsQuery } from '@/hooks/usePosts'
import { useWorkspaceAnalytics } from '@/hooks/useAnalytics'
import StatsCard from '@/components/analytics/StatsCard'
import PostCard from '@/components/post/PostCard'
import { Platform, PostStatus } from '@/types'
import { usePostStore } from '@/store/postStore'
import Button from '@/components/common/Button'
import PageLoader from '@/components/common/PageLoader'
import { format, subDays } from 'date-fns'
import { getPlatformColor, getPlatformIcon } from '@/utils/helpers'
import { Link } from 'react-router-dom'

/* ── Mini section card wrapper ───────────────────────────── */
function SectionCard({ children, accentColor = '#a855f7' }: { children: React.ReactNode; accentColor?: string }) {
  return (
    <div style={{
      borderRadius: 16, padding: '18px 20px',
      background: 'linear-gradient(145deg, #111827, #070b14)',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 40px rgba(0,0,0,0.5)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient corner glow */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
      {children}
    </div>
  )
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const { currentWorkspaceId, workspaces } = useWorkspaceStore()
  const workspace = workspaces.find((w) => w.id === currentWorkspaceId)
  const { data: posts = [], isLoading: postsLoading } = usePostsQuery()
  const { data: analytics = [], isLoading: analyticsLoading } = useWorkspaceAnalytics(
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

  const platformActivity = Object.values(Platform).map((p) => {
    const count = posts.filter((post) => post.platforms.includes(p)).length
    return { platform: p, count }
  }).filter((p) => p.count > 0).sort((a, b) => b.count - a.count).slice(0, 4)

  const upcomingPosts = posts
    .filter((p) => p.status === PostStatus.SCHEDULED && p.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 5)

  if (postsLoading || analyticsLoading) return <PageLoader />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>

      {/* ── Header ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#f1f5f9', marginBottom: 4 }}>
            {greeting},{' '}
            <span style={{ background: 'linear-gradient(135deg, #c084fc, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {user?.fullName?.split(' ')[0]}!
            </span>
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.7)', display: 'inline-block' }} />
            {workspace ? workspace.name : 'Select a workspace'} · {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <Button variant="gradient" onClick={() => openComposer()} glow leftIcon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        }>
          New Post
        </Button>
      </div>

      {/* ── Stats grid ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
        <StatsCard label="Total Posts"        value={posts.length}                      icon="📝" accent="brand"  />
        <StatsCard label="Scheduled"          value={scheduledCount}                    icon="📅" accent="blue"   />
        <StatsCard label="Published"          value={publishedCount}                    icon="✅" accent="green"  />
        <StatsCard label="Impressions (30d)"  value={totalImpressions.toLocaleString()} icon="👁️" accent="orange" />
      </div>

      {/* ── Main 2-col grid ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }} className="lg:grid-cols-[1fr_320px] grid-cols-1">

        {/* Left: Recent posts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>Recent Posts</h2>
            <Link to="/app/calendar"><Button variant="ghost" size="xs">View calendar →</Button></Link>
          </div>

          {recentPosts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} onClick={() => openComposer(post.id)} />
              ))}
            </div>
          ) : (
            <div style={{
              borderRadius: 16, padding: '48px 24px', textAlign: 'center',
              background: 'linear-gradient(145deg, #111827, #070b14)',
              border: '1px solid rgba(168,85,247,0.1)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, margin: '0 auto 16px',
                boxShadow: '0 0 20px rgba(168,85,247,0.15)',
              }}>✏️</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>No posts yet</p>
              <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', marginBottom: 20 }}>Create your first post to get started</p>
              <Button variant="gradient" onClick={() => openComposer()} glow>Create your first post</Button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Activity summary */}
          <SectionCard accentColor="#a855f7">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>Activity Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[
                { label: 'Drafts',      value: draftCount,                     color: 'rgba(148,163,184,0.5)' },
                { label: 'Scheduled',   value: scheduledCount,                  color: '#a855f7' },
                { label: 'Published',   value: publishedCount,                  color: '#34d399' },
                { label: 'Engagement',  value: totalEngagement.toLocaleString(), color: '#22d3ee' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, boxShadow: `0 0 6px ${item.color}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.8)' }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', fontVariantNumeric: 'tabular-nums' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Active platforms */}
          {platformActivity.length > 0 && (
            <SectionCard accentColor="#22d3ee">
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>Active Platforms</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {platformActivity.map(({ platform, count }) => (
                  <div key={platform} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                        background: `${getPlatformColor(platform as Platform)}22`,
                        border: `1px solid ${getPlatformColor(platform as Platform)}35`,
                        boxShadow: `0 0 8px ${getPlatformColor(platform as Platform)}25`,
                      }}>
                        {getPlatformIcon(platform as Platform)}
                      </span>
                      <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.8)', textTransform: 'capitalize' }}>
                        {platform.charAt(0) + platform.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{count} posts</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Upcoming posts */}
          {upcomingPosts.length > 0 && (
            <SectionCard accentColor="#34d399">
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>Upcoming</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => openComposer(post.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(168,85,247,0.06)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.15)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)' }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 6px rgba(168,85,247,0.7)', marginTop: 5, flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 11, color: 'rgba(226,232,240,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.caption?.slice(0, 50) ?? 'No caption'}
                      </p>
                      <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', marginTop: 2 }}>
                        {format(new Date(post.scheduledAt!), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Quick actions */}
          <SectionCard accentColor="#f472b6">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'New Post',  to: '/app/compose',    icon: '✏️', color: '#a855f7' },
                { label: 'Calendar',  to: '/app/calendar',   icon: '📅', color: '#22d3ee' },
                { label: 'Media',     to: '/app/media',      icon: '🖼️', color: '#f472b6' },
                { label: 'Analytics', to: '/app/analytics',  icon: '📊', color: '#34d399' },
              ].map(a => (
                <Link
                  key={a.label}
                  to={a.to}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 12, fontWeight: 600, color: 'rgba(148,163,184,0.8)',
                    textDecoration: 'none', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${a.color}12`; (e.currentTarget as HTMLAnchorElement).style.borderColor = `${a.color}30`; (e.currentTarget as HTMLAnchorElement).style.color = a.color }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(148,163,184,0.8)' }}
                >
                  <span style={{ fontSize: 14 }}>{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  )
}
