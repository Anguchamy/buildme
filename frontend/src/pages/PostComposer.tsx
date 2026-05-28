import { useState, useEffect } from 'react'
import { useCreatePostMutation, useUpdatePostMutation, usePostsQuery } from '@/hooks/usePosts'
import { useUploadMedia } from '@/hooks/useMedia'
import PlatformSelector from '@/components/post/PlatformSelector'
import CaptionEditor from '@/components/post/CaptionEditor'
import SchedulePicker from '@/components/post/SchedulePicker'
import UploadZone from '@/components/media/UploadZone'
import Button from '@/components/common/Button'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { mediaApi } from '@/api/mediaApi'
import { Platform, PostStatus, MediaAsset } from '@/types'
import { aiApi } from '@/api/aiApi'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { usePostStore } from '@/store/postStore'
import MediaGrid from '@/components/media/MediaGrid'
import { useMediaQuery } from '@/hooks/useMedia'
import { getPlatformColor, getPlatformIcon } from '@/utils/helpers'

const PLATFORM_CHAR_LIMITS: Record<Platform, number> = {
  [Platform.TWITTER]: 280,
  [Platform.INSTAGRAM]: 2200,
  [Platform.FACEBOOK]: 63206,
  [Platform.LINKEDIN]: 3000,
  [Platform.TIKTOK]: 2200,
  [Platform.YOUTUBE]: 5000,
  [Platform.PINTEREST]: 500,
}

interface PostComposerProps {
  onClose?: () => void
}

export default function PostComposer({ onClose }: PostComposerProps = {}) {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const editingPostId = usePostStore((s) => s.editingPostId)
  const { data: posts = [] } = usePostsQuery()
  const editingPost = editingPostId ? posts.find((p) => p.id === editingPostId) : null

  const [caption, setCaption] = useState('')
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>()
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([])
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (editingPost) {
      setCaption(editingPost.caption ?? '')
      setPlatforms((editingPost.platforms ?? []) as Platform[])
      setScheduledAt(editingPost.scheduledAt ? new Date(editingPost.scheduledAt) : undefined)
      setSelectedAssets(editingPost.mediaAssets ?? [])
    }
  }, [editingPost?.id])

  const resetForm = () => {
    setCaption('')
    setPlatforms([])
    setScheduledAt(undefined)
    setSelectedAssets([])
    setAiSuggestions([])
  }

  const createPost = useCreatePostMutation({
    onSuccess: () => {
      resetForm()
      setShowSuccess(true)
      setTimeout(() => { setShowSuccess(false); onClose?.() }, 1500)
    }
  })
  const updatePost = useUpdatePostMutation()
  const uploadMedia = useUploadMedia()
  const { data: mediaAssets = [] } = useMediaQuery()

  const handleGenerateAI = async () => {
    if (!caption.trim() && platforms.length === 0) return
    setAiLoading(true)
    try {
      const res = await aiApi.generateCaption({
        topic: caption || 'social media content',
        platform: platforms[0],
        includeHashtags: true,
        includeEmojis: true,
      })
      setAiSuggestions(res.captions)
    } catch (e) {
      console.error('AI generation failed', e)
    } finally {
      setAiLoading(false)
    }
  }

  const handleDraft = () => {
    const data = { caption, platforms, status: PostStatus.DRAFT, mediaAssetIds: selectedAssets.map((a) => a.id) }
    if (editingPostId) {
      updatePost.mutate({ postId: editingPostId, data }, { onSuccess: onClose })
    } else {
      createPost.mutate(data)
    }
  }

  const handleSchedule = () => {
    if (!scheduledAt) return
    const data = { caption, platforms, status: PostStatus.SCHEDULED, scheduledAt: scheduledAt.toISOString(), mediaAssetIds: selectedAssets.map((a) => a.id) }
    if (editingPostId) {
      updatePost.mutate({ postId: editingPostId, data }, { onSuccess: onClose })
    } else {
      createPost.mutate(data)
    }
  }

  const handlePostNow = () => {
    const data = { caption, platforms, status: PostStatus.PUBLISHED, mediaAssetIds: selectedAssets.map((a) => a.id) }
    if (editingPostId) {
      updatePost.mutate({ postId: editingPostId, data }, { onSuccess: onClose })
    } else {
      createPost.mutate(data)
    }
  }

  const toggleAsset = (asset: MediaAsset) => {
    setSelectedAssets((prev) =>
      prev.find((a) => a.id === asset.id)
        ? prev.filter((a) => a.id !== asset.id)
        : [...prev, asset]
    )
  }

  // Find most restrictive character limit
  const strictestLimit = platforms.length > 0
    ? Math.min(...platforms.map((p) => PLATFORM_CHAR_LIMITS[p]))
    : null

  const charCount = caption.length
  const charPercent = strictestLimit ? Math.min(100, (charCount / strictestLimit) * 100) : 0
  const isOverLimit = strictestLimit !== null && charCount > strictestLimit

  return (
    <div className="space-y-5">
      {!onClose && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {editingPost ? 'Edit Post' : 'Compose Post'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {editingPost ? 'Update your post details' : 'Create content for multiple platforms at once'}
          </p>
        </div>
      )}

      {showSuccess && (
        <div className="flex items-center gap-3 rounded-2xl bg-success-500/10 border border-success-500/30 text-success-500 px-4 py-3 text-sm animate-slide-up">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Post saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Composer */}
        <div className="space-y-5">
          {/* Platform Selector */}
          <div>
            <label className="label">Target Platforms</label>
            <PlatformSelector selected={platforms} onChange={setPlatforms} />
          </div>

          {/* Character limits per platform */}
          {platforms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => {
                const limit = PLATFORM_CHAR_LIMITS[p]
                const over = charCount > limit
                return (
                  <div
                    key={p}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold border ${
                      over
                        ? 'bg-red-500/10 border-red-500/30 text-red-500'
                        : 'bg-light-2 dark:bg-surface-3 border-light-3 dark:border-white/10 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <span>{getPlatformIcon(p)}</span>
                    <span>{charCount}/{limit}</span>
                    {over && <span>over!</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Caption */}
          <div>
            <CaptionEditor
              value={caption}
              onChange={setCaption}
              activePlatforms={platforms}
              onGenerateAI={handleGenerateAI}
            />
            {strictestLimit && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-light-3 dark:bg-surface-4 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all ${
                      isOverLimit ? 'bg-red-500' : charPercent > 80 ? 'bg-orange-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${charPercent}%` }}
                  />
                </div>
                <span className={`text-xs tabular-nums ${isOverLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                  {strictestLimit - charCount} left
                </span>
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          {aiLoading && (
            <div className="flex items-center gap-2 text-sm text-brand-400">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Generating AI captions...
            </div>
          )}
          {aiSuggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">AI Suggestions</p>
                <button onClick={() => setAiSuggestions([])} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white">Clear</button>
              </div>
              {aiSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setCaption(s); setAiSuggestions([]) }}
                  className="w-full text-left text-sm text-gray-700 dark:text-gray-300 bg-brand-500/5 hover:bg-brand-500/10 border border-brand-500/15 hover:border-brand-500/30 rounded-xl p-3.5 transition-all leading-relaxed"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Schedule */}
          <SchedulePicker value={scheduledAt} onChange={setScheduledAt} />

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="secondary"
              onClick={handleDraft}
              disabled={createPost.isPending || updatePost.isPending}
              loading={createPost.isPending}
              leftIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
              }
            >
              Save Draft
            </Button>
            <Button
              variant="gradient"
              onClick={handleSchedule}
              disabled={!scheduledAt || platforms.length === 0 || isOverLimit || createPost.isPending || updatePost.isPending}
              loading={createPost.isPending || updatePost.isPending}
              leftIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              }
            >
              Schedule
            </Button>
            <Button
              variant="secondary"
              onClick={handlePostNow}
              disabled={platforms.length === 0 || isOverLimit || createPost.isPending || updatePost.isPending}
              loading={createPost.isPending || updatePost.isPending}
            >
              Post Now
            </Button>
          </div>

          {isOverLimit && (
            <p className="text-xs text-red-500 font-medium">
              Caption exceeds the character limit for one or more selected platforms.
            </p>
          )}
        </div>

        {/* Right: Media */}
        <div className="space-y-4">
          <div>
            <label className="label">Media</label>
            <div className="flex gap-1 bg-light-2 dark:bg-surface-2 rounded-xl p-1 mb-3">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-surface-4 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Upload New
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'library'
                    ? 'bg-white dark:bg-surface-4 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Library ({mediaAssets.length})
              </button>
            </div>

            {activeTab === 'upload' && (
              <UploadZone
                onDrop={(files) => files.forEach((f) => uploadMedia.mutate(f))}
                isUploading={uploadMedia.isPending}
              />
            )}

            {activeTab === 'library' && (
              <MediaGrid
                assets={mediaAssets}
                onSelect={toggleAsset}
                selectedIds={selectedAssets.map((a) => a.id)}
              />
            )}
          </div>

          {selectedAssets.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Selected ({selectedAssets.length})
                </p>
                <button
                  onClick={() => setSelectedAssets([])}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedAssets.map((a) => (
                  <div key={a.id} className="relative w-14 h-14 rounded-xl overflow-hidden group">
                    {a.contentType?.startsWith('video/') ? (
                      <div className="w-full h-full bg-surface-3 flex items-center justify-center text-xl">🎬</div>
                    ) : (
                      <AuthenticatedImage
                        src={mediaApi.getFileUrl(workspaceId!, a.id)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      onClick={() => toggleAsset(a)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-lg transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post preview hint */}
          {platforms.length > 0 && caption && (
            <div className="card bg-light-1 dark:bg-surface-3 border-dashed">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Preview</p>
              <div className="space-y-2">
                {platforms.slice(0, 2).map((p) => {
                  const limit = PLATFORM_CHAR_LIMITS[p]
                  const truncated = caption.length > 120 ? caption.slice(0, 120) + '...' : caption
                  return (
                    <div key={p} className="flex items-start gap-2.5 p-3 bg-white dark:bg-surface-2 rounded-xl border border-light-3 dark:border-white/8">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: getPlatformColor(p) + '20' }}
                      >
                        {getPlatformIcon(p)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed break-words">{truncated}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-gray-400 capitalize">
                            {p.charAt(0) + p.slice(1).toLowerCase()}
                          </span>
                          <span className={`text-[10px] ${caption.length > limit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                            {caption.length}/{limit}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {platforms.length > 2 && (
                  <p className="text-xs text-gray-400 text-center">+{platforms.length - 2} more platforms</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
