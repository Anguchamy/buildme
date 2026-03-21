import api from './axios'
import { Workspace } from '@/types'

export interface CreateWorkspaceRequest {
  name: string
  description?: string
  logoUrl?: string
}

export const workspaceApi = {
  list: () => api.get<Workspace[]>('/workspaces').then((r) => r.data),

  getById: (id: number) =>
    api.get<Workspace>(`/workspaces/${id}`).then((r) => r.data),

  create: (data: CreateWorkspaceRequest) =>
    api.post<Workspace>('/workspaces', data).then((r) => r.data),

  update: (id: number, data: CreateWorkspaceRequest) =>
    api.put<Workspace>(`/workspaces/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/workspaces/${id}`).then((r) => r.data),
}
