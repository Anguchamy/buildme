import { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { Post } from '@/types'
import { classNames } from '@/utils/helpers'

interface Props {
  index: number
  post?: Post
  onDrop: (fromIndex: number, toIndex: number) => void
  onClick?: () => void
}

const ITEM_TYPE = 'GRID_CELL'

export default function GridCell({ index, post, onDrop, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { index },
    canDrag: !!post,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  })

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { index: number }) => onDrop(item.index, index),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  })

  drag(drop(ref))

  const thumbnail = post?.mediaAssets[0]?.thumbnailUrl ?? post?.mediaAssets[0]?.url

  return (
    <div
      ref={ref}
      onClick={!post ? onClick : undefined}
      className={classNames(
        'aspect-square rounded-sm overflow-hidden relative',
        isDragging ? 'opacity-40' : '',
        isOver ? 'ring-2 ring-brand-500' : '',
        !post ? 'bg-surface-3 cursor-pointer hover:bg-surface-4 flex items-center justify-center' : 'cursor-grab active:cursor-grabbing'
      )}
    >
      {post && thumbnail ? (
        <>
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
            <button
              onClick={onClick}
              className="opacity-0 hover:opacity-100 p-1 bg-white/20 rounded text-white text-xs"
            >
              ✏️
            </button>
          </div>
        </>
      ) : post ? (
        <div className="w-full h-full bg-brand-500/20 flex items-center justify-center">
          <p className="text-xs text-center text-brand-400 p-2 line-clamp-3">{post.caption}</p>
        </div>
      ) : (
        <span className="text-2xl text-gray-600">+</span>
      )}
    </div>
  )
}
