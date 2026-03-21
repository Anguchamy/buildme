import api from './axios'
import { AICaptionResponse, GenerateCaptionRequest } from '@/types'

export const aiApi = {
  generateCaption: (data: GenerateCaptionRequest) =>
    api.post<AICaptionResponse>('/ai/generate-caption', data).then((r) => r.data),

  suggestHashtags: (topic: string, platform?: string) =>
    api
      .post<{ hashtags: string[] }>('/ai/suggest-hashtags', { topic, platform })
      .then((r) => r.data),

  getBestTime: (workspaceId: number, platform: string) =>
    api
      .get<{ bestTime: string; platform: string }>('/ai/best-time', {
        params: { workspaceId, platform },
      })
      .then((r) => r.data),
}
