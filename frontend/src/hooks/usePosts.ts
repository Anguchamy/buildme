import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postApi } from '@/api/postApi'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { CreatePostRequest, SchedulePostRequest } from '@/types'

export function usePostsQuery() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  return useQuery({
    queryKey: ['posts', workspaceId],
    queryFn: () => postApi.list(workspaceId!),
    enabled: !!workspaceId,
  })
}

export function useCreatePostMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  return useMutation({
    mutationFn: (data: CreatePostRequest) => postApi.create(workspaceId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', workspaceId] })
      options?.onSuccess?.()
    },
  })
}

export function useUpdatePostMutation() {
  const queryClient = useQueryClient()
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  return useMutation({
    mutationFn: ({ postId, data }: { postId: number; data: Partial<CreatePostRequest> }) =>
      postApi.update(workspaceId!, postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', workspaceId] })
    },
  })
}

export function useDeletePostMutation() {
  const queryClient = useQueryClient()
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  return useMutation({
    mutationFn: (postId: number) => postApi.delete(workspaceId!, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', workspaceId] })
    },
  })
}

export function useSchedulePostMutation() {
  const queryClient = useQueryClient()
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  return useMutation({
    mutationFn: ({ postId, data }: { postId: number; data: SchedulePostRequest }) =>
      postApi.schedule(workspaceId!, postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', workspaceId] })
    },
  })
}
