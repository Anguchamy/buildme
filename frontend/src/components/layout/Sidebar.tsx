import { NavLink } from 'react-router-dom'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi } from '@/api/workspaceApi'
import { classNames } from '@/utils/helpers'
import { useAuthStore } from '@/store/authStore'
import { useRef } from 'react'

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: '📊' },
  // { to: '/app/grid', label: 'Grid Planner', icon: '⊞' },  // hidden
  { to: '/app/calendar', label: 'Calendar', icon: '📅' },
  { to: '/app/compose', label: 'Compose', icon: '✏️' },
  { to: '/app/media', label: 'Media Library', icon: '🖼️' },
  { to: '/app/analytics', label: 'Analytics', icon: '📈' },
  { to: '/app/integrations', label: 'Integrations', icon: '🔗' },
  { to: '/app/settings', label: 'Settings', icon: '⚙️' },
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
    <aside className="w-60 bg-white dark:bg-surface-1 border-r border-light-3 dark:border-white/5 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="h-14 px-5 flex items-center border-b border-light-3 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">build.me</span>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className="p-3 border-b border-light-3 dark:border-white/5">
        <select
          value={currentWorkspaceId ?? ''}
          onChange={(e) => setCurrentWorkspace(Number(e.target.value))}
          className="w-full bg-light-2 dark:bg-surface-3 border border-light-3 dark:border-white/10
                     rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-brand-500"
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
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                isActive
                  ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-500 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-light-2 dark:hover:bg-surface-3'
              )
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-light-3 dark:border-white/5">
        <p className="text-xs text-gray-400 text-center">build.me v1.0</p>
      </div>
    </aside>
  )
}
