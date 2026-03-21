import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Post } from '@/types'
import GridCell from './GridCell'

interface Props {
  posts: Post[]
  onReorder: (fromIndex: number, toIndex: number) => void
  onCellClick: (index: number, post?: Post) => void
  gridSize?: number
}

export default function InstagramGrid({ posts, onReorder, onCellClick, gridSize = 9 }: Props) {
  const cells = Array.from({ length: gridSize }, (_, i) => {
    const post = posts.find((p) => p.gridPosition === i) ??
      (i < posts.length ? posts[i] : undefined)
    return { index: i, post }
  })

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-3 gap-0.5 bg-surface-3 rounded-xl overflow-hidden max-w-sm">
        {cells.map(({ index, post }) => (
          <GridCell
            key={index}
            index={index}
            post={post}
            onDrop={onReorder}
            onClick={() => onCellClick(index, post)}
          />
        ))}
      </div>
    </DndProvider>
  )
}
