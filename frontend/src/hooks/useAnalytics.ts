import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/analyticsApi'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { format, subDays } from 'date-fns'

export function useWorkspaceAnalytics(from?: string, to?: string) {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const defaultFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd')
  const defaultTo = format(new Date(), 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['analytics', workspaceId, from ?? defaultFrom, to ?? defaultTo],
    queryFn: () =>
      analyticsApi.getWorkspaceAnalytics(workspaceId!, from ?? defaultFrom, to ?? defaultTo),
    enabled: !!workspaceId,
  })
}

export function usePostAnalytics(postId: number) {
  return useQuery({
    queryKey: ['analytics', 'post', postId],
    queryFn: () => analyticsApi.getPostAnalytics(postId),
    enabled: !!postId,
  })
}
