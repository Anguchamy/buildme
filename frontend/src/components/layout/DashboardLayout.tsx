import { lazy, Suspense, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import Modal from '@/components/common/Modal'
import { usePostStore } from '@/store/postStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { workspaceApi } from '@/api/workspaceApi'
import { useWorkspaceStore } from '@/store/workspaceStore'

const PostComposer = lazy(() => import('@/pages/PostComposer'))

export default function DashboardLayout() {
  const isComposerOpen = usePostStore((s) => s.isComposerOpen)
  const closeComposer = usePostStore((s) => s.closeComposer)
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces)

  useEffect(() => {
    workspaceApi.list().then(setWorkspaces).catch(() => {})
  }, [])

  return (
    <div className="app-root flex h-screen overflow-hidden">
      <style>{`
        .app-root  { background: #03040a; }
        .app-shell { background: #03040a; }
        .app-main  { background: #03040a; }
        html:not(.dark) .app-root  { background: #f8f9ff; }
        html:not(.dark) .app-shell { background: #f8f9ff; }
        html:not(.dark) .app-main  { background: #f8f9ff; }
      `}</style>
      <Sidebar />
      <div className="app-shell flex flex-col flex-1 overflow-hidden min-w-0">
        <TopBar />
        <main className="app-main flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <Modal isOpen={isComposerOpen} onClose={closeComposer} title="New Post" size="full">
        <Suspense fallback={<LoadingSpinner />}>
          <PostComposer onClose={closeComposer} />
        </Suspense>
      </Modal>
    </div>
  )
}
