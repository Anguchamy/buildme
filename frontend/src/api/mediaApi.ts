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

/**
 * Upload a file directly to R2 using a presigned PUT URL.
 * Returns the assetId for confirmation.
 */
export async function uploadViaPresignedUrl(
  workspaceId: number,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<number> {
  const { uploadUrl, assetId } = await mediaApi.getUploadUrl(workspaceId, {
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    fileSize: file.size,
  })

  if (!uploadUrl) {
    // R2 not configured — fall back to direct multipart
    await mediaApi.uploadDirect(workspaceId, file)
    return assetId
  }

  // PUT directly to R2 (bypasses Render proxy)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 PUT failed: ${xhr.status}`)))
    xhr.onerror = () => reject(new Error('Network error during R2 upload'))
    xhr.send(file)
  })

  await mediaApi.confirmUpload(workspaceId, assetId)
  return assetId
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
      .post<MediaAsset>(`/workspaces/${workspaceId}/media/upload`, form)
      .then((r) => r.data)
  },
}
