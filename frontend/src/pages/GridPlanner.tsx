import { useState } from 'react'
import { usePostsQuery, useUpdatePostMutation } from '@/hooks/usePosts'
import InstagramGrid from '@/components/grid/InstagramGrid'
import Modal from '@/components/common/Modal'
import PostCard from '@/components/post/PostCard'
import { Post } from '@/types'

export default function GridPlanner() {
  const { data: posts = [], isLoading } = usePostsQuery()
  const updatePost = useUpdatePostMutation()
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const fromPost = posts.find((p) => p.gridPosition === fromIndex || posts.indexOf(p) === fromIndex)
    const toPost = posts.find((p) => p.gridPosition === toIndex || posts.indexOf(p) === toIndex)

    if (fromPost) {
      updatePost.mutate({ postId: fromPost.id, data: { gridPosition: toIndex } })
    }
    if (toPost) {
      updatePost.mutate({ postId: toPost.id, data: { gridPosition: fromIndex } })
    }
  }

  const handleCellClick = (_index: number, post?: Post) => {
    if (post) setSelectedPost(post)
  }

  if (isLoading) {
    return <div className="animate-pulse text-gray-400">Loading grid...</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grid Planner</h1>
        <p className="text-gray-400 text-sm mt-1">
          Visualize your Instagram grid. Drag and drop to reorder posts.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Grid Preview */}
        <div className="flex-shrink-0">
          <h2 className="text-sm font-medium text-gray-300 mb-3">Grid Preview</h2>
          <InstagramGrid
            posts={posts}
            onReorder={handleReorder}
            onCellClick={handleCellClick}
          />
        </div>

        {/* Post List */}
        <div className="flex-1">
          <h2 className="text-sm font-medium text-gray-300 mb-3">All Posts ({posts.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
            ))}
          </div>
        </div>
      </div>

      {/* Post detail modal */}
      <Modal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title="Post Details"
        size="md"
      >
        {selectedPost && <PostCard post={selectedPost} />}
      </Modal>
    </div>
  )
}
