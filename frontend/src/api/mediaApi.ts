import api from './axios'
import { MediaAsset } from '@/types'

export interface UploadUrlRequest {
  fileName: string
  contentType: string
  fileSize?: number
}

export interface UploadUrlResponse {
  uploadUrl: string
  assetId: number
  s3Key: string
}

export const mediaApi = {
  getUploadUrl: (workspaceId: number, data: UploadUrlRequest) =>
    api
      .post<UploadUrlResponse>(`/workspaces/${workspaceId}/media/upload-url`, data)
      .then((r) => r.data),

  confirmUpload: (workspaceId: number, assetId: number) =>
    api
      .post<MediaAsset>(`/workspaces/${workspaceId}/media/${assetId}/confirm`)
      .then((r) => r.data),

  list: (workspaceId: number, page = 0, size = 20) =>
    api
      .get<MediaAsset[]>(`/workspaces/${workspaceId}/media`, { params: { page, size } })
      .then((r) => r.data),

  getFileUrl: (workspaceId: number, assetId: number) =>
    `/workspaces/${workspaceId}/media/${assetId}/file`,

  delete: (workspaceId: number, assetId: number) =>
    api.delete(`/workspaces/${workspaceId}/media/${assetId}`).then((r) => r.data),

  uploadDirect: (workspaceId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<MediaAsset>(`/workspaces/${workspaceId}/media/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}
