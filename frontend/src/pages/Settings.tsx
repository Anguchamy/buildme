import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { workspaceApi } from '@/api/workspaceApi'
import subscriptionApi from '@/api/subscriptionApi'
import api from '@/api/axios'
import Button from '@/components/common/Button'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { mediaApi } from '@/api/mediaApi'

type Tab = 'profile' | 'workspace' | 'subscription' | 'notifications'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

const FREE_LIMIT = 10
const NOTIF_KEY = 'buildme-notifications'
const defaultNotifs = {
  postPublished: true,
  postFailed: true,
  weeklyReport: false,
  tokenExpiry: true,
}

function loadNotifs() {
  try {
    const s = localStorage.getItem(NOTIF_KEY)
    return s ? { ...defaultNotifs, ...JSON.parse(s) } : defaultNotifs
  } catch { return defaultNotifs }
}

export default function Settings() {
  const [tab, setTab] = useState<Tab>('profile')
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { currentWorkspaceId, workspaces, setWorkspaces } = useWorkspaceStore()
  const workspace = workspaces.find((w) => w.id === currentWorkspaceId)
  const queryClient = useQueryClient()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // ── Profile ──
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const avatarFileRef = useRef<File | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    setFullName(user?.fullName ?? '')
    setAvatarBase64(null)
    avatarFileRef.current = null
  }, [user?.id])

  const updateProfile = useMutation({
    mutationFn: async () => {
      let avatarUrl: string | undefined
      if (avatarFileRef.current && currentWorkspaceId) {
        const asset = await mediaApi.uploadDirect(currentWorkspaceId, avatarFileRef.current)
        avatarUrl = mediaApi.getFileUrl(currentWorkspaceId, asset.id)
      }
      return api.patch('/users/me', { fullName, ...(avatarUrl ? { avatarUrl } : {}) }).then((r) => r.data)
    },
    onSuccess: (updated) => {
      setUser(updated)
      setAvatarBase64(null)
      avatarFileRef.current = null
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    avatarFileRef.current = file
    const reader = new FileReader()
    reader.onload = () => setAvatarBase64(reader.result as string)
    reader.readAsDataURL(file)
  }

  // ── Workspace ──
  const [wsName, setWsName] = useState(workspace?.name ?? '')
  const [wsDesc, setWsDesc] = useState(workspace?.description ?? '')
  const [wsSaved, setWsSaved] = useState(false)

  useEffect(() => {
    setWsName(workspace?.name ?? '')
    setWsDesc(workspace?.description ?? '')
  }, [workspace?.id])

  const updateWorkspace = useMutation({
    mutationFn: () => workspaceApi.update(currentWorkspaceId!, { name: wsName, description: wsDesc }),
    onSuccess: (updated) => {
      setWorkspaces(workspaces.map((w) => (w.id === updated.id ? updated : w)))
      setWsSaved(true)
      setTimeout(() => setWsSaved(false), 2000)
    },
  })

  // ── Subscription ──
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['subscription', currentWorkspaceId],
    queryFn: () => subscriptionApi.getSubscription(currentWorkspaceId!),
    enabled: !!currentWorkspaceId && tab === 'subscription',
  })

  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null)

  const openRazorpay = async (planType: string) => {
    if (!currentWorkspaceId) return
    setUpgradingPlan(planType)
    try {
      const { razorpaySubscriptionId, keyId } = await subscriptionApi.initiateUpgrade(currentWorkspaceId, planType)
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load Razorpay'))
          document.head.appendChild(s)
        })
      }
      new window.Razorpay({
        key: keyId,
        subscription_id: razorpaySubscriptionId,
        name: 'build.me',
        description: `${planType === 'PRO' ? 'Pro' : 'Agency'} Plan`,
        prefill: { email: user?.email, name: user?.fullName },
        theme: { color: '#6366f1' },
        handler: async (res: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          await subscriptionApi.verifyPayment({
            razorpayPaymentId: res.razorpay_payment_id,
            razorpaySubscriptionId: res.razorpay_subscription_id,
            razorpaySignature: res.razorpay_signature,
          })
          queryClient.invalidateQueries({ queryKey: ['subscription', currentWorkspaceId] })
          setUpgradingPlan(null)
        },
      }).open()
    } catch (e) {
      console.error('Upgrade failed:', e)
      setUpgradingPlan(null)
    }
  }

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionApi.cancelSubscription(currentWorkspaceId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription', currentWorkspaceId] }),
  })

  // ── Notifications ──
  const [notifs, setNotifs] = useState(loadNotifs)
  const [notifSaved, setNotifSaved] = useState(false)

  const toggleNotif = (key: keyof typeof defaultNotifs) =>
    setNotifs((prev: typeof defaultNotifs) => ({ ...prev, [key]: !prev[key] }))

  const saveNotifs = () => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs))
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 2000)
  }

  const notifItems: { key: keyof typeof defaultNotifs; label: string; desc: string }[] = [
    { key: 'postPublished', label: 'Post published successfully', desc: 'Get notified when a post goes live' },
    { key: 'postFailed',    label: 'Post failed to publish',      desc: 'Get alerted when publishing fails' },
    { key: 'weeklyReport',  label: 'Weekly analytics summary',    desc: 'Receive weekly performance reports' },
    { key: 'tokenExpiry',   label: 'Platform token expiry',       desc: 'Get reminded to reconnect platforms' },
  ]

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile',       label: '👤 Profile' },
    { key: 'workspace',     label: '🏢 Workspace' },
    { key: 'subscription',  label: '💳 Subscription' },
    { key: 'notifications', label: '🔔 Notifications' },
  ]

  const postsUsed = subscription?.postsUsedThisMonth ?? 0
  const postLimit = subscription?.monthlyPostLimit ?? FREE_LIMIT
  const usedPct   = Math.min(100, (postsUsed / postLimit) * 100)

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your account and workspace settings</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-light-2 dark:bg-surface-2 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors font-medium ${
              tab === t.key
                ? 'bg-white dark:bg-surface-4 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile ── */}
      {tab === 'profile' && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Profile</h2>
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {avatarBase64 ? (
                <img src={avatarBase64} alt="avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-brand-500/30" />
              ) : user?.avatarUrl ? (
                <AuthenticatedImage src={user.avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-brand-500/30" />
              ) : (
                <div className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center text-xl font-bold text-white">
                  {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-500 hover:bg-brand-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                title="Change avatar"
              >✎</button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.fullName}</p>
              <button onClick={() => avatarInputRef.current?.click()} className="text-xs text-brand-500 hover:text-brand-600 mt-0.5">
                Change photo
              </button>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input opacity-60 cursor-not-allowed" value={user?.email ?? ''} disabled />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => updateProfile.mutate()} loading={updateProfile.isPending} disabled={!fullName.trim()}>
              Save Changes
            </Button>
            {profileSaved && <span className="text-sm text-green-500">Saved!</span>}
            {updateProfile.isError && <span className="text-sm text-red-500">Failed to save.</span>}
          </div>
        </div>
      )}

      {/* ── Workspace ── */}
      {tab === 'workspace' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Workspace Settings</h2>
          <div>
            <label className="label">Workspace Name</label>
            <input className="input max-w-sm" value={wsName} onChange={(e) => setWsName(e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={wsDesc} onChange={(e) => setWsDesc(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => updateWorkspace.mutate()} loading={updateWorkspace.isPending} disabled={!wsName.trim()}>
              Save Workspace
            </Button>
            {wsSaved && <span className="text-sm text-green-500">Saved!</span>}
            {updateWorkspace.isError && <span className="text-sm text-red-500">Failed to save.</span>}
          </div>
        </div>
      )}

      {/* ── Subscription ── */}
      {tab === 'subscription' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Current Plan</h2>
            {subLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-light-2 dark:bg-surface-3 rounded animate-pulse w-1/3" />
                <div className="h-3 bg-light-2 dark:bg-surface-3 rounded animate-pulse w-1/2" />
              </div>
            ) : subscription ? (
              <>
                <div className="flex items-center justify-between p-4 bg-light-2 dark:bg-surface-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {subscription.planType === 'FREE' ? '🆓' : subscription.planType === 'PRO' ? '⭐' : '🏢'}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {subscription.planType.charAt(0) + subscription.planType.slice(1).toLowerCase()} Plan
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {subscription.planType === 'FREE'
                          ? `${postsUsed} of ${postLimit} posts used this month`
                          : `Renews ${subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN') : '—'}`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    subscription.status === 'ACTIVE'  ? 'bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                    subscription.status === 'PENDING' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                                                        'bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                  }`}>{subscription.status}</span>
                </div>

                {subscription.planType === 'FREE' && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                      <span>Posts this month</span>
                      <span className={usedPct >= 90 ? 'text-red-500 font-semibold' : ''}>{postsUsed} / {postLimit}</span>
                    </div>
                    <div className="w-full bg-light-3 dark:bg-surface-3 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${usedPct >= 90 ? 'bg-red-500' : 'bg-brand-500'}`}
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                    {usedPct >= 90 && <p className="text-xs text-red-500 mt-1.5">Almost at your limit — upgrade to keep posting.</p>}
                  </div>
                )}

                {subscription.planType !== 'FREE' && !subscription.cancelAtPeriodEnd && (
                  <Button variant="secondary" size="sm" onClick={() => cancelMutation.mutate()} loading={cancelMutation.isPending}>
                    Cancel at period end
                  </Button>
                )}
                {subscription.cancelAtPeriodEnd && (
                  <p className="text-xs text-amber-500 dark:text-amber-400">⚠ Plan cancels at end of billing period.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">Unable to load subscription.</p>
            )}
          </div>

          {(!subscription || subscription.planType === 'FREE') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="card border-brand-500/40 hover:border-brand-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-900 dark:text-white">Pro</p>
                  <span className="text-xs bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full font-medium">Popular</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹499<span className="text-sm font-normal text-gray-400">/mo</span></p>
                <ul className="mt-3 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <li className="flex gap-1.5"><span className="text-brand-500">✓</span> Unlimited posts</li>
                  <li className="flex gap-1.5"><span className="text-brand-500">✓</span> All 7 platforms</li>
                  <li className="flex gap-1.5"><span className="text-brand-500">✓</span> AI captions</li>
                  <li className="flex gap-1.5"><span className="text-brand-500">✓</span> 3 team seats</li>
                </ul>
                <Button className="mt-4 w-full justify-center" size="sm" onClick={() => openRazorpay('PRO')} loading={upgradingPlan === 'PRO'}>
                  Upgrade to Pro
                </Button>
              </div>
              <div className="card hover:border-light-4 dark:hover:border-white/20 transition-colors">
                <p className="font-bold text-gray-900 dark:text-white mb-2">Agency</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹1,499<span className="text-sm font-normal text-gray-400">/mo</span></p>
                <ul className="mt-3 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <li className="flex gap-1.5"><span className="text-brand-500">✓</span> Unlimited workspaces</li>
                  <li className="flex gap-1.5"><span className="text-brand-500">✓</span> 10 team seats</li>
                  <li className="flex gap-1.5"><span className="text-brand-500">✓</span> White-label reports</li>
                  <li className="flex gap-1.5"><span className="text-brand-500">✓</span> Priority support</li>
                </ul>
                <Button variant="secondary" className="mt-4 w-full justify-center" size="sm" onClick={() => openRazorpay('AGENCY')} loading={upgradingPlan === 'AGENCY'}>
                  Upgrade to Agency
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Notifications ── */}
      {tab === 'notifications' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Notifications</h2>
              <p className="text-xs text-gray-400 mt-0.5">Choose which in-app notifications you receive</p>
            </div>
            <div className="flex items-center gap-2">
              {notifSaved && <span className="text-xs text-green-500">Saved!</span>}
              <Button size="sm" variant="secondary" onClick={saveNotifs}>Save</Button>
            </div>
          </div>
          <div className="space-y-1">
            {notifItems.map((item, i) => (
              <div
                key={item.key}
                className={`flex items-center gap-4 py-3 ${i < notifItems.length - 1 ? 'border-b border-light-2 dark:border-white/5' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotif(item.key)}
                  className={`relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-4 ${
                    notifs[item.key] ? 'bg-brand-500' : 'bg-light-3 dark:bg-surface-4'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    notifs[item.key] ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
