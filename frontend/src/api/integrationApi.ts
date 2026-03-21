import api from './axios'
import { SocialAccount } from '@/types'

export const integrationApi = {
  getConnectedAccounts: (workspaceId: number) =>
    api.get<SocialAccount[]>(`/integrations/${workspaceId}/accounts`).then((r) => r.data),

  getOAuthUrl: (workspaceId: number, platform: string) =>
    api
      .get<{ url: string; state: string }>(
        `/integrations/${workspaceId}/${platform.toLowerCase()}/oauth-url`
      )
      .then((r) => r.data),

  disconnect: (workspaceId: number, platform: string) =>
    api
      .delete(`/integrations/${workspaceId}/${platform.toLowerCase()}/disconnect`)
      .then((r) => r.data),
}
