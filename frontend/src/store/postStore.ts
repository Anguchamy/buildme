import { create } from 'zustand'
import { Platform, PostStatus, MediaAsset } from '@/types'

export interface DraftPost {
  caption: string
  platforms: Platform[]
  scheduledAt?: Date
  mediaAssets: MediaAsset[]
  gridPosition?: number
  notes?: string
}

interface PostState {
  draft: DraftPost
  isComposerOpen: boolean
  editingPostId: number | null
  updateDraft: (updates: Partial<DraftPost>) => void
  resetDraft: () => void
  openComposer: (postId?: number) => void
  closeComposer: () => void
}

const defaultDraft: DraftPost = {
  caption: '',
  platforms: [],
  mediaAssets: [],
}

export const usePostStore = create<PostState>((set) => ({
  draft: defaultDraft,
  isComposerOpen: false,
  editingPostId: null,

  updateDraft: (updates) =>
    set((state) => ({ draft: { ...state.draft, ...updates } })),

  resetDraft: () => set({ draft: defaultDraft, editingPostId: null }),

  openComposer: (postId) =>
    set({ isComposerOpen: true, editingPostId: postId ?? null }),

  closeComposer: () =>
    set({ isComposerOpen: false, editingPostId: null, draft: defaultDraft }),
}))
