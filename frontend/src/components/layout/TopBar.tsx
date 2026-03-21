import { useAuthStore } from '@/store/authStore'
import { useLogoutMutation } from '@/hooks/useAuth'
import { useThemeStore } from '@/store/themeStore'
import Button from '@/components/common/Button'

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function TopBar() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogoutMutation()
  const { theme, toggleTheme } = useThemeStore()

  return (
    <header className="h-14 bg-white dark:bg-surface-1 border-b border-light-3 dark:border-white/5 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search posts, media..."
          className="input w-64 !py-1.5 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg transition-colors
                     text-gray-500 hover:text-gray-900 hover:bg-light-2
                     dark:text-gray-400 dark:hover:text-white dark:hover:bg-surface-3"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg transition-colors
                           text-gray-500 hover:text-gray-900 hover:bg-light-2
                           dark:text-gray-400 dark:hover:text-white dark:hover:bg-surface-3">
          🔔
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-500 rounded-full" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-light-3 dark:bg-surface-4 mx-1" />

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{user?.fullName}</p>
            <p className="text-xs text-gray-400 leading-tight">{user?.email}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout.mutate()}
          loading={logout.isPending}
        >
          Logout
        </Button>
      </div>
    </header>
  )
}
