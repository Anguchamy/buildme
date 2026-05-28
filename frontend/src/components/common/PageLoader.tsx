/**
 * Full-page skeleton loader shown while a page is fetching its initial data.
 * Usage: if (isLoading) return <PageLoader />
 */
export default function PageLoader() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-xl bg-light-3 dark:bg-surface-3" />
          <div className="h-4 w-64 rounded-lg bg-light-2 dark:bg-surface-2" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-light-3 dark:bg-surface-3" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="h-3 w-16 rounded bg-light-3 dark:bg-surface-3" />
            <div className="h-7 w-24 rounded-lg bg-light-3 dark:bg-surface-3" />
            <div className="h-2 w-20 rounded bg-light-2 dark:bg-surface-2" />
          </div>
        ))}
      </div>

      {/* Main content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="h-4 w-32 rounded-lg bg-light-3 dark:bg-surface-3" />
            <div className="h-3 w-full rounded bg-light-2 dark:bg-surface-2" />
            <div className="h-3 w-4/5 rounded bg-light-2 dark:bg-surface-2" />
            <div className="h-24 w-full rounded-xl bg-light-2 dark:bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
