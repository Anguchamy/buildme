import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi, Notification } from '@/api/notificationApi'

const QUERY_KEY = ['notifications']

export function useNotifications() {
  const queryClient = useQueryClient()

  // Initial fetch
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: notificationApi.list,
    staleTime: 30_000,
  })

  // SSE: push new notifications in real-time
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
    const url = `${apiBase}/notifications/stream?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)

    es.addEventListener('notification', (e) => {
      const incoming: Notification = JSON.parse(e.data)
      queryClient.setQueryData<Notification[]>(QUERY_KEY, (prev = []) => [incoming, ...prev])
    })

    es.onerror = () => {
      // EventSource auto-reconnects; nothing extra needed
    }

    return () => es.close()
  }, [queryClient])

  const markRead = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: (_, id) => {
      queryClient.setQueryData<Notification[]>(QUERY_KEY, (prev = []) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    },
  })

  const markAllRead = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(QUERY_KEY, (prev = []) =>
        prev.map((n) => ({ ...n, read: true }))
      )
    },
  })

  const notifications = query.data ?? []
  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, markRead, markAllRead, isLoading: query.isLoading }
}
