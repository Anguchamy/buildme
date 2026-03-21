import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { integrationApi } from '@/api/integrationApi'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { Platform, SocialAccount } from '@/types'
import { getPlatformColor, getPlatformIcon } from '@/utils/helpers'
import Button from '@/components/common/Button'

export default function Integrations() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const connectedPlatform = searchParams.get('connected')
  const oauthError = searchParams.get('error')

  useEffect(() => {
    if (connectedPlatform || oauthError) {
      queryClient.invalidateQueries({ queryKey: ['social-accounts', workspaceId] })
      // Clear query params without navigation
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

  const getAccount = (platform: Platform): SocialAccount | undefined =>
    accounts.find((a) => a.platform === platform && a.connected)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
        <p className="text-gray-400 text-sm mt-1">Connect your social media accounts</p>
      </div>

      {connectedPlatform && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 text-sm">
          ✓ {connectedPlatform.charAt(0).toUpperCase() + connectedPlatform.slice(1)} connected successfully!
        </div>
      )}
      {oauthError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-sm">
          Connection failed: {oauthError}. Make sure your OAuth credentials are configured.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platform) => {
          const account = getAccount(platform)
          return (
            <div key={platform} className="card flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: getPlatformColor(platform) + '20' }}
              >
                {getPlatformIcon(platform)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white capitalize">
                  {platform.charAt(0) + platform.slice(1).toLowerCase()}
                </h3>
                {account ? (
                  <>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      @{account.handle ?? account.displayName ?? account.accountId}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        Connected
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnectMutation.mutate(platform)}
                        loading={disconnectMutation.isPending}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mt-0.5">Not connected</p>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => connectMutation.mutate(platform)}
                      loading={connectMutation.isPending}
                    >
                      Connect
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
