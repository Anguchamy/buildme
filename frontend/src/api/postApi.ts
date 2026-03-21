import api from './axios'
import { Post, CreatePostRequest, SchedulePostRequest } from '@/types'

export const postApi = {
  list: (workspaceId: number) =>
    api.get<Post[]>(`/workspaces/${workspaceId}/posts`).then((r) => r.data),

  getById: (workspaceId: number, postId: number) =>
    api.get<Post>(`/workspaces/${workspaceId}/posts/${postId}`).then((r) => r.data),

  getCalendarPosts: (workspaceId: number, start: string, end: string) =>
    api
      .get<Post[]>(`/workspaces/${workspaceId}/posts/calendar`, {
        params: { start, end },
      })
      .then((r) => r.data),

  create: (workspaceId: number, data: CreatePostRequest) =>
    api.post<Post>(`/workspaces/${workspaceId}/posts`, data).then((r) => r.data),

  update: (workspaceId: number, postId: number, data: Partial<CreatePostRequest>) =>
    api
      .put<Post>(`/workspaces/${workspaceId}/posts/${postId}`, data)
      .then((r) => r.data),

  schedule: (workspaceId: number, postId: number, data: SchedulePostRequest) =>
    api
      .post<Post>(`/workspaces/${workspaceId}/posts/${postId}/schedule`, data)
      .then((r) => r.data),

  delete: (workspaceId: number, postId: number) =>
    api.delete(`/workspaces/${workspaceId}/posts/${postId}`).then((r) => r.data),
}
