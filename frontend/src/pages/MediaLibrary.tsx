import { useState } from 'react'
import { useMediaQuery, useUploadMedia, useDeleteMedia } from '@/hooks/useMedia'
import MediaGrid from '@/components/media/MediaGrid'
import UploadZone from '@/components/media/UploadZone'
import Button from '@/components/common/Button'
import ConfirmDialog from '@/components/common/ConfirmDialog'

type Tab = 'my-files' | 'upload'

export default function MediaLibrary() {
  const [tab, setTab] = useState<Tab>('my-files')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: assets = [], isLoading } = useMediaQuery()
  const uploadMedia = useUploadMedia()
  const deleteMedia = useDeleteMedia()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'my-files', label: '📁 My Files' },
    { key: 'upload', label: '⬆️ Upload' },
  ]

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
            <MediaGrid assets={assets} onDelete={(id) => setDeleteId(id)} />
          )}
        </div>
      )}

      {tab === 'upload' && (
        <div className="max-w-lg">
          <UploadZone
            onDrop={(files) => files.forEach((f) => uploadMedia.mutate(f))}
            isUploading={uploadMedia.isPending}
          />
          {uploadMedia.isSuccess && (
            <p className="text-green-500 text-sm mt-3">Upload successful!</p>
          )}
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
