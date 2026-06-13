import api from './axios'
import {
  PendingInstagramAccountsResponse,
  SocialAccount,
} from '@/types'

export const integrationApi = {
  getConnectedAccounts: (workspaceId: number) =>
    api.get<SocialAccount[]>(`/integrations/${workspaceId}/accounts`).then((r) => r.data),

  getOAuthUrl: (workspaceId: number, platform: string, force = false) =>
    api
      .get<{ url: string; state: string }>(
        `/integrations/${workspaceId}/${platform.toLowerCase()}/oauth-url`,
        { params: force ? { force: true } : {} }
      )
      .then((r) => r.data),

  disconnect: (workspaceId: number, platform: string) =>
    api
      .delete(`/integrations/${workspaceId}/${platform.toLowerCase()}/disconnect`)
      .then((r) => r.data),

  disconnectOne: (workspaceId: number, platform: string, accountId: string) =>
    api
      .delete(
        `/integrations/${workspaceId}/${platform.toLowerCase()}/disconnect/${encodeURIComponent(accountId)}`
      )
      .then((r) => r.data),

  getPendingInstagramAccounts: (session: string) =>
    api
      .get<PendingInstagramAccountsResponse>(
        `/integrations/instagram/pending-accounts?session=${encodeURIComponent(session)}`
      )
      .then((r) => r.data),

  connectInstagramAccounts: (session: string, igUserIds: string[]) =>
    api
      .post<SocialAccount[]>(`/integrations/instagram/connect-accounts`, {
        session,
        igUserIds,
      })
      .then((r) => r.data),
}
