import { useState } from 'react'
import { useMediaQuery, useDeleteMedia } from '@/hooks/useMedia'
import { useQueryClient } from '@tanstack/react-query'
import UploadZone from '@/components/media/UploadZone'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { mediaApi, uploadViaPresignedUrl } from '@/api/mediaApi'
import { MediaAsset } from '@/types'
import { useWorkspaceStore } from '@/store/workspaceStore'
import Button from '@/components/common/Button'
import PageLoader from '@/components/common/PageLoader'

type Tab = 'my-files' | 'upload'
type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'image' | 'video'

function formatBytes(bytes?: number) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MediaTypeIcon({ contentType }: { contentType?: string }) {
  if (contentType?.startsWith('video/')) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
          <svg className="ml-0.5" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      </div>
    )
  }
  return null
}

export default function MediaLibrary() {
  const [tab, setTab] = useState<Tab>('my-files')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [preview, setPreview] = useState<MediaAsset | null>(null)
  const [fileStatuses, setFileStatuses] = useState<Record<string, 'uploading' | 'success' | 'error'>>({})
  const [isUploading, setIsUploading] = useState(false)
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)!
  const queryClient = useQueryClient()

  const { data: assets = [], isLoading } = useMediaQuery()
  const deleteMedia = useDeleteMedia()

  if (isLoading) return <PageLoader />

  const filteredAssets = assets.filter((a) => {
    if (filterType === 'image') return a.contentType?.startsWith('image/')
    if (filterType === 'video') return a.contentType?.startsWith('video/')
    return true
  })

  const handleUpload = (files: File[]) => {
    setFileStatuses({})
    const initial: Record<string, 'uploading' | 'success' | 'error'> = {}
    files.forEach((f) => { initial[f.name] = 'uploading' })
    setFileStatuses(initial)
    setIsUploading(true)

    const promises = files.map((f) =>
      uploadViaPresignedUrl(workspaceId, f)
        .then(() => setFileStatuses((prev) => ({ ...prev, [f.name]: 'success' })))
        .catch(() => setFileStatuses((prev) => ({ ...prev, [f.name]: 'error' })))
    )

    Promise.all(promises).then(() => {
      setIsUploading(false)
      queryClient.invalidateQueries({ queryKey: ['media', workspaceId] })
    })
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Media Library</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {assets.length} {assets.length === 1 ? 'asset' : 'assets'} &middot; Manage images and videos
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setTab('upload')}>
          Upload Files
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex bg-light-2 dark:bg-surface-2 rounded-xl p-1 gap-1">
          <button
            onClick={() => setTab('my-files')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === 'my-files' ? 'bg-white dark:bg-surface-4 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            My Files ({assets.length})
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === 'upload' ? 'bg-white dark:bg-surface-4 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Upload
          </button>
        </div>

        {/* Type filter */}
        {tab === 'my-files' && (
          <div className="flex bg-light-2 dark:bg-surface-2 rounded-xl p-1 gap-1">
            {(['all', 'image', 'video'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${filterType === f ? 'bg-white dark:bg-surface-4 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {f === 'all' ? 'All' : f === 'image' ? 'Images' : 'Videos'}
              </button>
            ))}
          </div>
        )}

        {/* View mode */}
        {tab === 'my-files' && (
          <div className="flex bg-light-2 dark:bg-surface-2 rounded-xl p-1 gap-1 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-surface-4 shadow-sm' : 'text-gray-400'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-surface-4 shadow-sm' : 'text-gray-400'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* My Files */}
      {tab === 'my-files' && (
        <div>
          {isLoading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3' : 'space-y-2'}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`${viewMode === 'grid' ? 'aspect-square' : 'h-16'} rounded-2xl bg-light-2 dark:bg-surface-3 animate-pulse`} />
              ))}
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="card text-center py-16">
              <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🖼️</div>
              <p className="text-gray-900 dark:text-white font-semibold">
                {filterType !== 'all' ? `No ${filterType}s found` : 'No media yet'}
              </p>
              <p className="text-gray-400 text-sm mt-1">Upload some files to get started</p>
              <Button variant="gradient" className="mt-5" onClick={() => setTab('upload')}>Upload Files</Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-light-2 dark:bg-surface-3 cursor-pointer hover:ring-2 hover:ring-brand-500/50 transition-all duration-200"
                  onClick={() => setPreview(asset)}
                >
                  {asset.contentType?.startsWith('image/') ? (
                    <AuthenticatedImage
                      src={asset.url ?? mediaApi.getFileUrl(workspaceId, asset.id)}
                      alt={asset.originalName ?? ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-3 flex items-center justify-center text-3xl">
                      🎬
                    </div>
                  )}
                  <MediaTypeIcon contentType={asset.contentType} />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <div className="flex gap-1 w-full">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreview(asset) }}
                        className="flex-1 text-white text-[10px] bg-white/20 rounded-lg py-1 hover:bg-white/30 transition-colors"
                      >
                        Preview
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(asset.id) }}
                        className="px-2 text-white text-[10px] bg-red-500/80 rounded-lg py-1 hover:bg-red-500 transition-colors"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="card flex items-center gap-4 p-3 hover:border-brand-500/20 cursor-pointer transition-all"
                  onClick={() => setPreview(asset)}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-light-2 dark:bg-surface-3 flex-shrink-0">
                    {asset.contentType?.startsWith('image/') ? (
                      <AuthenticatedImage
                        src={mediaApi.getFileUrl(workspaceId, asset.id)}
                        alt={asset.originalName ?? ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{asset.originalName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{asset.contentType} &middot; {formatBytes(asset.fileSize)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(asset.id) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload tab */}
      {tab === 'upload' && (
        <div className="max-w-xl space-y-4">
          <UploadZone onDrop={handleUpload} isUploading={isUploading} />
          {Object.keys(fileStatuses).length > 0 && (
            <div className="card space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Upload Progress</p>
              {Object.entries(fileStatuses).map(([name, status]) => (
                <div key={name} className="flex items-center gap-3 py-1.5">
                  <span className="text-base">
                    {status === 'uploading' ? '⏳' : status === 'success' ? '✅' : '❌'}
                  </span>
                  <span className="flex-1 text-sm truncate text-gray-700 dark:text-gray-300">{name}</span>
                  <span className={`text-xs font-medium ${status === 'success' ? 'text-success-500' : status === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
                    {status === 'uploading' ? 'Uploading...' : status === 'success' ? 'Done' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image/Video Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Close
            </button>
            {preview.contentType?.startsWith('image/') ? (
              <AuthenticatedImage
                src={preview.url ?? mediaApi.getFileUrl(workspaceId, preview.id)}
                alt={preview.originalName ?? ''}
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            ) : preview.contentType?.startsWith('video/') ? (
              <video
                controls
                className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl"
                src={preview.url ?? mediaApi.getFileUrl(workspaceId, preview.id)}
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="text-white text-center p-12 bg-surface-2 rounded-2xl">
                <p className="text-5xl mb-4">📄</p>
                <p className="font-medium">{preview.originalName}</p>
                <p className="text-gray-400 text-sm mt-1">{formatBytes(preview.fileSize)}</p>
              </div>
            )}
            <p className="text-white/50 text-xs text-center mt-3">{preview.originalName} &middot; {formatBytes(preview.fileSize)}</p>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteMedia.mutate(deleteId)
          setDeleteId(null)
        }}
        title="Delete Asset"
        message="Are you sure you want to delete this media asset? This cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMedia.isPending}
      />
    </div>
  )
}
