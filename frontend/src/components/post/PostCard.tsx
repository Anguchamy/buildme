import { Post } from '@/types'
import StatusBadge from '@/components/common/StatusBadge'
import PlatformIcon from '@/components/common/PlatformIcon'
import { formatDate, truncate } from '@/utils/helpers'

interface Props {
  post: Post
  onClick?: () => void
}

export default function PostCard({ post, onClick }: Props) {
  const thumbnail = post.mediaAssets[0]?.thumbnailUrl ?? post.mediaAssets[0]?.url

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:border-white/20 transition-all duration-200 group"
    >
      {thumbnail && (
        <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-surface-3">
          <img src={thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex gap-1 flex-wrap">
          {post.platforms.map((p) => (
            <PlatformIcon key={p} platform={p} size="sm" />
          ))}
        </div>
        <StatusBadge status={post.status} />
      </div>

      {post.caption && (
        <p className="text-sm text-gray-300 line-clamp-2 mb-2">
          {truncate(post.caption, 100)}
        </p>
      )}

      {post.scheduledAt && (
        <p className="text-xs text-gray-500">
          🕐 {formatDate(post.scheduledAt, 'MMM d, h:mm a')}
        </p>
      )}
    </div>
  )
}
