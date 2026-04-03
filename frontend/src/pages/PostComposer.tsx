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

  useEffect(() => {
    if (editingPost) {
      setCaption(editingPost.caption ?? '')
      setPlatforms((editingPost.platforms ?? []) as Platform[])
      setScheduledAt(editingPost.scheduledAt ? new Date(editingPost.scheduledAt) : undefined)
      setSelectedAssets(editingPost.mediaAssets ?? [])
    }
  }, [editingPost?.id])

  const createPost = useCreatePostMutation({ onSuccess: onClose })
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

  return (
    <div className="space-y-6">
      {!onClose && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingPost ? 'Edit Post' : 'Compose Post'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {editingPost ? 'Update your post details' : 'Create content for multiple platforms at once'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Composer */}
        <div className="space-y-5">
          {/* Platform Selector */}
          <div>
            <label className="label">Platforms</label>
            <PlatformSelector selected={platforms} onChange={setPlatforms} />
          </div>

          {/* Caption */}
          <CaptionEditor
            value={caption}
            onChange={setCaption}
            activePlatforms={platforms}
            onGenerateAI={handleGenerateAI}
          />

          {/* AI Suggestions */}
          {aiLoading && <p className="text-sm text-brand-400 animate-pulse">✨ Generating captions...</p>}
          {aiSuggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-medium">AI Suggestions (click to use)</p>
              {aiSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setCaption(s)}
                  className="w-full text-left text-sm text-gray-300 bg-surface-3 hover:bg-surface-4
                             border border-white/5 rounded-lg p-3 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Schedule */}
          <SchedulePicker value={scheduledAt} onChange={setScheduledAt} />

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleDraft} loading={createPost.isPending}>
              Save Draft
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={!scheduledAt || platforms.length === 0}
              loading={createPost.isPending}
            >
              Schedule
            </Button>
            <Button
              variant="ghost"
              onClick={handlePostNow}
              disabled={platforms.length === 0}
              loading={createPost.isPending}
            >
              Post Now
            </Button>
          </div>

          {createPost.isSuccess && (
            <p className="text-green-400 text-sm">Post created successfully!</p>
          )}
        </div>

        {/* Right: Media */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`text-sm px-3 py-1.5 rounded-lg ${activeTab === 'upload' ? 'bg-brand-500 text-white font-medium' : 'text-gray-400 hover:text-white'}`}
            >
              Upload
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`text-sm px-3 py-1.5 rounded-lg ${activeTab === 'library' ? 'bg-brand-500 text-white font-medium' : 'text-gray-400 hover:text-white'}`}
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

          {selectedAssets.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Selected ({selectedAssets.length})</p>
              <div className="flex flex-wrap gap-2">
                {selectedAssets.map((a) => (
                  <div key={a.id} className="relative w-12 h-12 rounded overflow-hidden">
                    <AuthenticatedImage src={mediaApi.getFileUrl(workspaceId!, a.id)} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => toggleAsset(a)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
