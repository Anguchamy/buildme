import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { integrationApi } from '@/api/integrationApi'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { Platform, SocialAccount } from '@/types'
import { getPlatformColor, getPlatformIcon } from '@/utils/helpers'
import Button from '@/components/common/Button'

const platformDescriptions: Record<Platform, string> = {
  [Platform.INSTAGRAM]: 'Share photos, reels, and stories to your Instagram audience.',
  [Platform.TIKTOK]: 'Upload short-form videos directly to TikTok.',
  [Platform.FACEBOOK]: 'Post to your Facebook page or profile.',
  [Platform.TWITTER]: 'Tweet and thread to your Twitter followers.',
  [Platform.LINKEDIN]: 'Share professional content on LinkedIn.',
  [Platform.YOUTUBE]: 'Publish video content to your YouTube channel.',
  [Platform.PINTEREST]: 'Pin images and ideas to your Pinterest boards.',
}

const comingSoonPlatforms: Platform[] = [Platform.TIKTOK, Platform.PINTEREST]

export default function Integrations() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const connectedPlatform = searchParams.get('connected')
  const oauthError = searchParams.get('error')

  useEffect(() => {
    if (connectedPlatform || oauthError) {
      queryClient.invalidateQueries({ queryKey: ['social-accounts', workspaceId] })
      setSearchParams({}, { replace: true })
    }
  }, [connectedPlatform, oauthError])

  const { data: accounts = [] } = useQuery({
    queryKey: ['social-accounts', workspaceId],
    queryFn: () => integrationApi.getConnectedAccounts(workspaceId!),
    enabled: !!workspaceId,
  })

  const connectMutation = useMutation({
    mutationFn: async (platform: string) => {
      const { url } = await integrationApi.getOAuthUrl(workspaceId!, platform)
      window.location.href = url
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: (platform: string) => integrationApi.disconnect(workspaceId!, platform),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-accounts', workspaceId] }),
  })

  const platforms = Object.values(Platform)
  const connectedCount = accounts.filter((a) => a.connected).length

  const getAccount = (platform: Platform): SocialAccount | undefined =>
    accounts.find((a) => a.platform === platform && a.connected)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Integrations</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {connectedCount} of {platforms.length} platforms connected
        </p>
      </div>

      {/* Connection progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Platform Coverage</p>
          <span className="text-sm font-bold text-brand-500">{connectedCount}/{platforms.length}</span>
        </div>
        <div className="w-full bg-light-3 dark:bg-surface-4 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500"
            style={{ width: `${(connectedCount / platforms.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Connect all platforms to maximize your posting reach
        </p>
      </div>

      {/* Success/error banners */}
      {connectedPlatform && (
        <div className="flex items-center gap-3 rounded-2xl bg-success-500/10 border border-success-500/30 text-success-500 px-4 py-3 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {connectedPlatform.charAt(0).toUpperCase() + connectedPlatform.slice(1)} connected successfully!
        </div>
      )}
      {oauthError && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          Connection failed: {oauthError}. Make sure your OAuth credentials are configured.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {platforms.map((platform) => {
          const account = getAccount(platform)
          const color = getPlatformColor(platform)
          const icon = getPlatformIcon(platform)
          const platformName = platform.charAt(0) + platform.slice(1).toLowerCase()
          const isComingSoon = comingSoonPlatforms.includes(platform)

          return (
            <div
              key={platform}
              className={`card flex flex-col gap-4 transition-all duration-200 ${
                isComingSoon ? 'opacity-60' : account ? 'hover:border-success-500/20' : 'hover:border-brand-500/20'
              }`}
            >
              {/* Platform header */}
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border"
                  style={{ backgroundColor: color + '15', borderColor: color + '30' }}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{platformName}</h3>
                    {isComingSoon && (
                      <span className="text-[10px] font-semibold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                    {!isComingSoon && account && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-success-500 bg-success-500/10 px-1.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {platformDescriptions[platform]}
                  </p>
                </div>
              </div>

              {/* Account info or connect */}
              {isComingSoon ? (
                <Button size="sm" variant="secondary" className="w-full justify-center" disabled>
                  Coming Soon
                </Button>
              ) : account ? (
                <div className="flex items-center justify-between pt-2 border-t border-light-3 dark:border-white/5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">
                      @{account.handle ?? account.displayName ?? account.accountId}
                    </p>
                    {account.tokenExpiresAt && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Token expires {new Date(account.tokenExpiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => disconnectMutation.mutate(platform)}
                    loading={disconnectMutation.isPending}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full justify-center"
                  onClick={() => connectMutation.mutate(platform)}
                  loading={connectMutation.isPending}
                  leftIcon={
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  }
                >
                  Connect {platformName}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
