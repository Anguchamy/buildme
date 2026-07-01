import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useLogoutMutation } from '@/hooks/useAuth'
import { useThemeStore } from '@/store/themeStore'
import { usePostStore } from '@/store/postStore'
import { useNotifications } from '@/hooks/useNotifications'
import Button from '@/components/common/Button'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function typeIcon(type: string) {
  switch (type) {
    case 'POST_PUBLISHED': return '✅'
    case 'POST_FAILED':    return '❌'
    case 'POST_SCHEDULED': return '🕐'
    case 'SOCIAL_ACCOUNT_CONNECTED': return '🔗'
    case 'SOCIAL_ACCOUNT_DISCONNECTED': return '🔌'
    default: return '🔔'
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function TopBar() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogoutMutation()
  const { theme, toggleTheme } = useThemeStore()
  const openComposer = usePostStore((s) => s.openComposer)
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const [search, setSearch] = useState('')
  const notifsRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header
      className="app-topbar h-14 flex items-center justify-between px-5 shrink-0 gap-4"
      style={{
        background: 'rgba(7,11,20,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(28,26,255,0.1)',
        zIndex: 50,
      }}
    >
      <style>{`
        html:not(.dark) header.app-topbar {
          background: rgba(255,255,255,0.92) !important;
          border-bottom-color: rgba(28,26,255,0.1) !important;
        }
        html:not(.dark) .app-topbar .input { color: #0f172a; }
        html:not(.dark) .app-topbar .input::placeholder { color: #94a3b8; }
        .app-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 1000;
          background: linear-gradient(145deg, #111827 0%, #070b14 100%);
          border: 1px solid rgba(28,26,255,0.18);
          border-radius: 16px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03);
          overflow: hidden;
        }
        html:not(.dark) .app-dropdown {
          background: #ffffff;
          border-color: rgba(0,0,0,0.08);
          box-shadow: 0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
        }
      `}</style>
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          placeholder="Search posts, media..."
          className="input w-full pl-9 pr-3 py-1.5"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Compose quick action */}
        <Button size="sm" variant="gradient" onClick={() => openComposer()} leftIcon={
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        }>
          New Post
        </Button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-all"
        style={{ color: 'var(--text-3)', background: 'transparent' }}
        onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(28,26,255,0.1)'; b.style.color = '#1C1AFF' }}
        onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.color = 'var(--text-3)' }}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUser(false) }}
            className="relative p-2 rounded-lg transition-all"
            style={{ color: 'var(--text-3)', background: 'transparent' }}
            onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(28,26,255,0.1)'; b.style.color = '#1C1AFF' }}
            onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.color = 'var(--text-3)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="app-dropdown w-80 animate-scale-in">
              <div className="px-4 py-3 border-b border-light-3 dark:border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span
                    className="text-xs text-brand-500 cursor-pointer hover:text-brand-600"
                    onClick={() => markAllRead.mutate()}
                  >
                    Mark all read
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No notifications yet</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.read) markRead.mutate(n.id) }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-light-1 dark:hover:bg-surface-3 transition-colors cursor-pointer ${!n.read ? 'bg-brand-50/40 dark:bg-brand-500/5' : ''}`}
                  >
                    <span className="text-lg leading-none mt-0.5">{typeIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-light-3 dark:bg-surface-4 mx-1" />

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setShowUser(!showUser); setShowNotifs(false) }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-light-2 dark:hover:bg-surface-3 transition-colors"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-brand-500/20">
              {user?.avatarUrl ? (
                <AuthenticatedImage src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
                  {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{user?.fullName}</p>
            </div>
            <svg className="text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {showUser && (
            <div className="app-dropdown w-48 animate-scale-in">
              <div className="px-4 py-3 border-b border-light-3 dark:border-white/5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  {logout.isPending ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
