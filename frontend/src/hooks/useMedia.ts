import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mediaApi } from '@/api/mediaApi'
import { useWorkspaceStore } from '@/store/workspaceStore'

export function useMediaQuery(page = 0, size = 20) {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  return useQuery({
    queryKey: ['media', workspaceId, page, size],
    queryFn: () => mediaApi.list(workspaceId!, page, size),
    enabled: !!workspaceId,
  })
}

export function useUploadMedia() {
  const queryClient = useQueryClient()
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  return useMutation({
    mutationFn: async (file: File) => {
      if (!workspaceId) throw new Error('No workspace selected')
      return mediaApi.uploadDirect(workspaceId, file)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', workspaceId] })
    },
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  return useMutation({
    mutationFn: (assetId: number) => mediaApi.delete(workspaceId!, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', workspaceId] })
    },
  })
}
