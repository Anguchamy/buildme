import { NavLink } from 'react-router-dom'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi } from '@/api/workspaceApi'
import { classNames } from '@/utils/helpers'
import { useAuthStore } from '@/store/authStore'
import { useRef } from 'react'

const navItems = [
  {
    to: '/app/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    to: '/app/calendar',
    label: 'Calendar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    to: '/app/compose',
    label: 'Compose',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    highlight: true,
  },
  {
    to: '/app/media',
    label: 'Media',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    to: '/app/analytics',
    label: 'Analytics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
  {
    to: '/app/integrations',
    label: 'Integrations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
  {
    to: '/app/settings',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
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

  return (
    <aside className="w-[220px] bg-white dark:bg-surface-1 border-r border-light-3 dark:border-white/5 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center border-b border-light-3 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-brand flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">build.me</span>
            <span className="block text-[10px] text-gray-400 leading-none">Social Planner</span>
          </div>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className="px-3 py-3 border-b border-light-3 dark:border-white/5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Workspace</p>
        <select
          value={currentWorkspaceId ?? ''}
          onChange={(e) => setCurrentWorkspace(Number(e.target.value))}
          className="w-full bg-light-1 dark:bg-surface-3 border border-light-3 dark:border-white/10
                     rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-brand-500/40 cursor-pointer"
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
          {workspaces.length === 0 && (
            <option value="" disabled>No workspaces</option>
          )}
        </select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              classNames(
                'nav-item',
                isActive ? 'nav-item-active' : 'nav-item-inactive'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={classNames(
                  'flex-shrink-0 transition-colors',
                  isActive
                    ? 'text-brand-500 dark:text-brand-400'
                    : 'text-gray-400 dark:text-gray-500'
                )}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto w-1.5 h-1.5 bg-brand-500 rounded-full flex-shrink-0" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-light-3 dark:border-white/5">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">
              {user?.fullName}
            </p>
            <p className="text-[10px] text-gray-400 truncate leading-tight">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
