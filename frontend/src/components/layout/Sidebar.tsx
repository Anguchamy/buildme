import { NavLink } from 'react-router-dom'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi } from '@/api/workspaceApi'
import { classNames } from '@/utils/helpers'
import { useAuthStore } from '@/store/authStore'
import { useRef } from 'react'

const navItems = [
  {
    to: '/app/dashboard', label: 'Dashboard',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  },
  {
    to: '/app/calendar', label: 'Calendar',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    to: '/app/compose', label: 'Compose', highlight: true,
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  },
  {
    to: '/app/media', label: 'Media',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  },
  {
    to: '/app/analytics', label: 'Analytics',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  },
  {
    to: '/app/integrations', label: 'Integrations',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  },
  {
    to: '/app/settings', label: 'Settings',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
]

export default function Sidebar() {
  const { currentWorkspaceId, workspaces, setCurrentWorkspace, setWorkspaces } = useWorkspaceStore()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const autoCreated = useRef(false)

  const createWorkspace = useMutation({
    mutationFn: (name: string) => workspaceApi.create({ name }),
    onSuccess: (workspace) => {
      setWorkspaces([workspace])
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })

  useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const data = await workspaceApi.list()
      setWorkspaces(data)
      if (data.length === 0 && user && !autoCreated.current) {
        autoCreated.current = true
        createWorkspace.mutate(`${user.fullName}'s Workspace`)
      }
      return data
    },
    staleTime: 30000,
  })

  const initial = user?.fullName?.[0]?.toUpperCase() ?? 'U'

  return (
    <aside style={{
      width: 228,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
      position: 'relative',
      background: 'linear-gradient(180deg, #0c1221 0%, #070b14 60%, #03040a 100%)',
      borderRight: '1px solid rgba(28,26,255,0.1)',
    }}>

      {/* Ambient glow at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 200,
        background: 'radial-gradient(ellipse at 50% -20%, rgba(28,26,255,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Dot grid pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4,
        backgroundImage: 'radial-gradient(rgba(28,26,255,0.12) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      {/* ── Logo ── */}
      <div style={{
        height: 64, padding: '0 20px',
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid rgba(28,26,255,0.1)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* 3D logo mark */}
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #1C1AFF, #3b82f6 50%, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 20px rgba(28,26,255,0.5), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            position: 'relative',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
              <span style={{
                background: 'linear-gradient(135deg, #1C1AFF, #0ea5e9)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>build.me</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.05em' }}>
              SOCIAL PLANNER
            </div>
          </div>
        </div>
      </div>

      {/* ── Workspace switcher ── */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid rgba(28,26,255,0.08)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, color: 'rgba(28,26,255,0.7)', paddingLeft: 4 }}>
          Workspace
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={currentWorkspaceId ?? ''}
            onChange={(e) => setCurrentWorkspace(Number(e.target.value))}
            style={{
              width: '100%',
              background: 'rgba(28,26,255,0.06)',
              border: '1px solid rgba(28,26,255,0.2)',
              borderRadius: 10,
              padding: '7px 28px 7px 10px',
              fontSize: 12,
              color: 'var(--text-2)',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(28,26,255,0.5)'
              e.target.style.boxShadow = '0 0 0 3px rgba(28,26,255,0.12)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(28,26,255,0.2)'
              e.target.style.boxShadow = 'none'
            }}
          >
            {workspaces.map((w) => <option key={w.id} value={w.id} style={{ background: '#111827' }}>{w.name}</option>)}
            {workspaces.length === 0 && <option value="" disabled>No workspaces</option>}
          </select>
          <svg style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'rgba(28,26,255,0.6)', pointerEvents: 'none' }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 8, color: 'var(--text-4)' }}>
          Menu
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => classNames('nav-item', isActive ? 'nav-item-active' : 'nav-item-inactive')}
            >
              {({ isActive }) => (
                <>
                  <span style={{
                    flexShrink: 0,
                    transition: 'filter 0.2s',
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(28,26,255,0.8))' : 'none',
                    color: isActive ? '#1C1AFF' : undefined,
                  }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                  {item.highlight && !isActive && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: '#1C1AFF',
                      boxShadow: '0 0 8px rgba(28,26,255,0.8)',
                      animation: 'glowPulse 2s ease-in-out infinite',
                    }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── User footer ── */}
      <div style={{
        padding: 12,
        borderTop: '1px solid rgba(28,26,255,0.08)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          transition: 'background 0.2s, border-color 0.2s',
          cursor: 'default',
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(28,26,255,0.06)'
            e.currentTarget.style.borderColor = 'rgba(28,26,255,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #1C1AFF, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'white',
            boxShadow: '0 0 12px rgba(28,26,255,0.4)',
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
              {user?.email}
            </div>
          </div>
          {/* Online dot */}
          <div style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: '#34d399',
            boxShadow: '0 0 8px rgba(52,211,153,0.7)',
          }} />
        </div>
      </div>

      {/* Light mode overrides */}
      <style>{`
        html:not(.dark) aside {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
          border-right-color: rgba(28,26,255,0.1) !important;
        }
        html:not(.dark) aside select { color: #1e293b !important; }
      `}</style>
    </aside>
  )
}
