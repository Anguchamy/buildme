import { useState } from 'react'
import { useMediaQuery, useDeleteMedia } from '@/hooks/useMedia'
import { useQueryClient } from '@tanstack/react-query'
import MediaGrid from '@/components/media/MediaGrid'
import UploadZone from '@/components/media/UploadZone'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { mediaApi } from '@/api/mediaApi'
import { MediaAsset } from '@/types'
import { useWorkspaceStore } from '@/store/workspaceStore'

type Tab = 'my-files' | 'upload'

export default function MediaLibrary() {
  const [tab, setTab] = useState<Tab>('my-files')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [preview, setPreview] = useState<MediaAsset | null>(null)
  const [fileStatuses, setFileStatuses] = useState<Record<string, 'uploading' | 'success' | 'error'>>({})
  const [isUploading, setIsUploading] = useState(false)
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)!
  const queryClient = useQueryClient()

  const { data: assets = [], isLoading } = useMediaQuery()
  const deleteMedia = useDeleteMedia()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'my-files', label: '📁 My Files' },
    { key: 'upload', label: '⬆️ Upload' },
  ]

  const handleUpload = (files: File[]) => {
    setFileStatuses({})
    const initial: Record<string, 'uploading' | 'success' | 'error'> = {}
    files.forEach((f) => { initial[f.name] = 'uploading' })
    setFileStatuses(initial)
    setIsUploading(true)

    const promises = files.map((f) =>
      mediaApi.uploadDirect(workspaceId, f)
        .then(() => setFileStatuses((prev) => ({ ...prev, [f.name]: 'success' })))
        .catch(() => setFileStatuses((prev) => ({ ...prev, [f.name]: 'error' })))
    )

    Promise.all(promises).then(() => {
      setIsUploading(false)
      queryClient.invalidateQueries({ queryKey: ['media', workspaceId] })
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Media Library</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your images, videos, and assets</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-light-3 dark:border-white/5 pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              tab === t.key
                ? 'bg-light-2 dark:bg-surface-2 text-gray-900 dark:text-white border-b-2 border-brand-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'my-files' && (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-light-2 dark:bg-surface-3 animate-pulse" />
              ))}
            </div>
          ) : (
            <MediaGrid assets={assets} onSelect={setPreview} onDelete={(id) => setDeleteId(id)} />
          )}
        </div>
      )}

      {tab === 'upload' && (
        <div className="max-w-lg">
          <UploadZone
            onDrop={handleUpload}
            isUploading={isUploading}
          />
          {Object.keys(fileStatuses).length > 0 && (
            <ul className="mt-4 space-y-1">
              {Object.entries(fileStatuses).map(([name, status]) => (
                <li key={name} className="flex items-center gap-2 text-sm">
                  <span>{status === 'uploading' ? '⏳' : status === 'success' ? '✅' : '❌'}</span>
                  <span className="truncate text-gray-300">{name}</span>
                  <span className={status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-gray-400'}>
                    {status === 'uploading' ? 'Uploading...' : status === 'success' ? 'Done' : 'Failed'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-8 right-0 text-white text-sm hover:text-gray-300"
            >
              ✕ Close
            </button>
            {preview.contentType?.startsWith('image/') ? (
              <AuthenticatedImage
                src={mediaApi.getFileUrl(workspaceId, preview.id)}
                alt={preview.originalName}
                className="max-h-[80vh] max-w-full rounded-lg object-contain"
              />
            ) : (
              <div className="text-white text-center p-8">
                <p className="text-4xl mb-2">🎬</p>
                <p>{preview.originalName}</p>
              </div>
            )}
            <p className="text-gray-400 text-xs text-center mt-2">{preview.originalName}</p>
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
