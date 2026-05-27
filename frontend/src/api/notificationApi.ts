import api from './axios'

export interface Notification {
  id: number
  type: 'POST_PUBLISHED' | 'POST_FAILED' | 'POST_SCHEDULED' | 'SOCIAL_ACCOUNT_CONNECTED' | 'SOCIAL_ACCOUNT_DISCONNECTED' | 'GENERAL'
  title: string
  message: string
  read: boolean
  createdAt: string
}

export const notificationApi = {
  list: (): Promise<Notification[]> =>
    api.get('/notifications').then((r) => r.data),

  unreadCount: (): Promise<number> =>
    api.get('/notifications/unread-count').then((r) => r.data.count),

  markRead: (id: number): Promise<void> =>
    api.patch(`/notifications/${id}/read`).then(() => undefined),

  markAllRead: (): Promise<void> =>
    api.patch('/notifications/read-all').then(() => undefined),
}
