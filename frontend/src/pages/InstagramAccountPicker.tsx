import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { integrationApi } from '@/api/integrationApi'
import { useWorkspaceStore } from '@/store/workspaceStore'
import Button from '@/components/common/Button'
import PageLoader from '@/components/common/PageLoader'

export default function InstagramAccountPicker() {
  const [searchParams] = useSearchParams()
  const session = searchParams.get('session') ?? ''
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [initialized, setInitialized] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) {
      navigate('/app/integrations?error=missing_session', { replace: true })
    }
  }, [session, navigate])

  const query = useQuery({
    queryKey: ['ig-pending', session],
    queryFn: () => integrationApi.getPendingInstagramAccounts(session),
    enabled: !!session,
    retry: false,
  })

  // Pre-check already-connected accounts the first time the list lands.
  useEffect(() => {
    if (query.data && !initialized) {
      const next = new Set<string>()
      for (const a of query.data.accounts) {
        if (a.alreadyConnected) next.add(a.igUserId)
      }
      setSelectedIds(next)
      setInitialized(true)
    }
  }, [query.data, initialized])

  // Treat 401 from the pending-accounts GET as "session expired" and bounce.
  useEffect(() => {
    const err = query.error as { response?: { status?: number } } | undefined
    if (err?.response?.status === 401) {
      navigate('/app/integrations?error=session_expired', { replace: true })
    }
  }, [query.error, navigate])

  const connect = useMutation({
    mutationFn: () =>
      integrationApi.connectInstagramAccounts(session, Array.from(selectedIds)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts', workspaceId] })
      navigate('/app/integrations?connected=instagram', { replace: true })
    },
    onError: (err: { response?: { status?: number; data?: { code?: string } } }) => {
      const status = err?.response?.status
      const code = err?.response?.data?.code
      if (status === 401 || code === 'session_expired') {
        navigate('/app/integrations?error=session_expired', { replace: true })
        return
      }
      if (code === 'no_selection') {
        setInlineError('Pick at least one Instagram account to connect.')
        return
      }
      if (code === 'unknown_account') {
        setInlineError('One of the selected accounts is no longer valid. Please reconnect Instagram.')
        return
      }
      setInlineError('Could not connect the selected accounts. Please try again.')
    },
  })

  const toggle = (igUserId: string) => {
    setInlineError(null)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(igUserId)) next.delete(igUserId)
      else next.add(igUserId)
      return next
    })
  }

  if (!session) return null
  if (query.isLoading) return <PageLoader />

  if (query.isError && (query.error as { response?: { status?: number } })?.response?.status !== 401) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="card border-red-500/30">
          <p className="text-sm font-semibold text-red-400 mb-1">Couldn't load Instagram accounts</p>
          <p className="text-xs text-gray-400">
            The selection link may have expired. Please reconnect Instagram from the Integrations page.
          </p>
          <div className="mt-4">
            <Button size="sm" variant="secondary" onClick={() => navigate('/app/integrations')}>
              Back to Integrations
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const accounts = query.data?.accounts ?? []

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Pick your Instagram accounts
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Your Facebook account is linked to {accounts.length} Instagram Business {accounts.length === 1 ? 'account' : 'accounts'}.
          Choose which to connect — you can connect more than one.
        </p>
      </div>

      <div className="card space-y-2">
        {accounts.map((a) => {
          const checked = selectedIds.has(a.igUserId)
          return (
            <label
              key={a.igUserId}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                checked
                  ? 'border-brand-500/40 bg-brand-500/5'
                  : 'border-light-3 dark:border-white/8 hover:border-brand-500/20'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(a.igUserId)}
                className="w-4 h-4 accent-brand-500 flex-shrink-0"
              />
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-light-3 dark:ring-white/10">
                {a.profilePictureUrl ? (
                  <img
                    src={a.profilePictureUrl}
                    alt={a.igUsername}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-sm font-bold text-white">
                    {a.igUsername.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">@{a.igUsername}</p>
                  {a.alreadyConnected && (
                    <span className="text-[10px] font-semibold text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      Will refresh
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {a.displayName} · via FB Page: {a.pageName || a.pageId}
                </p>
              </div>
            </label>
          )
        })}
      </div>

      {inlineError && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {inlineError}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="gradient"
          onClick={() => {
            if (selectedIds.size === 0) {
              setInlineError('Pick at least one Instagram account to connect.')
              return
            }
            connect.mutate()
          }}
          loading={connect.isPending}
          disabled={connect.isPending}
        >
          Connect {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/app/integrations')}
          disabled={connect.isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
