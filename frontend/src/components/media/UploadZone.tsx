import { useDropzone } from 'react-dropzone'
import { classNames, formatBytes } from '@/utils/helpers'

interface Props {
  onDrop: (files: File[]) => void
  accept?: Record<string, string[]>
  maxSize?: number
  isUploading?: boolean
}

export default function UploadZone({ onDrop, accept, maxSize = 50 * 1024 * 1024, isUploading }: Props) {
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: accept ?? {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi'],
    },
    maxSize,
  })

  return (
    <div
      {...getRootProps()}
      className={classNames(
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
        isDragActive && !isDragReject ? 'border-brand-500 bg-brand-500/10' : '',
        isDragReject ? 'border-red-500 bg-red-500/10' : '',
        !isDragActive ? 'border-white/10 hover:border-white/30' : ''
      )}
    >
      <input {...getInputProps()} />
      <div className="space-y-2">
        <div className="text-3xl">{isUploading ? '⏳' : '📁'}</div>
        {isUploading ? (
          <p className="text-sm text-gray-400">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-sm text-brand-400">Drop files here</p>
        ) : (
          <>
            <p className="text-sm text-white font-medium">Drop files or click to upload</p>
            <p className="text-xs text-gray-500">
              Images and videos up to {formatBytes(maxSize)}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
