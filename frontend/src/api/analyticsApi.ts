import api from './axios'
import { Analytics } from '@/types'

export const analyticsApi = {
  getWorkspaceAnalytics: (workspaceId: number, from: string, to: string) =>
    api
      .get<Analytics[]>(`/analytics/workspace/${workspaceId}`, { params: { from, to } })
      .then((r) => r.data),

  getPostAnalytics: (postId: number) =>
    api.get<Analytics[]>(`/analytics/posts/${postId}`).then((r) => r.data),

  syncAnalytics: (workspaceId: number) =>
    api.post(`/analytics/workspace/${workspaceId}/sync`).then((r) => r.data),
}
