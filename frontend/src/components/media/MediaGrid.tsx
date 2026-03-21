import { MediaAsset } from '@/types'
import { formatBytes } from '@/utils/helpers'

interface Props {
  assets: MediaAsset[]
  onSelect?: (asset: MediaAsset) => void
  onDelete?: (assetId: number) => void
  selectedIds?: number[]
}

export default function MediaGrid({ assets, onSelect, onDelete, selectedIds = [] }: Props) {
  if (assets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-3xl mb-2">🖼️</p>
        <p>No media assets yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {assets.map((asset) => {
        const isSelected = selectedIds.includes(asset.id)
        const isImage = asset.contentType?.startsWith('image/')
        const isVideo = asset.contentType?.startsWith('video/')

        return (
          <div
            key={asset.id}
            onClick={() => onSelect?.(asset)}
            className={`relative group aspect-square rounded-lg overflow-hidden bg-surface-3 cursor-pointer
              ${isSelected ? 'ring-2 ring-brand-500' : ''}`}
          >
            {isImage && (
              <img
                src={asset.thumbnailUrl ?? asset.url}
                alt={asset.originalName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            )}
            {isVideo && (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-3xl">🎬</span>
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />

            {/* Delete button */}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(asset.id) }}
                className="absolute top-1 right-1 p-1 bg-red-500 rounded text-white text-xs
                           opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}

            {/* File size */}
            {asset.fileSize && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5
                             opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-gray-300 truncate">{formatBytes(asset.fileSize)}</p>
              </div>
            )}

            {isSelected && (
              <div className="absolute top-1 left-1 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                ✓
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
