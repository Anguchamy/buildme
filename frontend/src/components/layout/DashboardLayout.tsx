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
    <div className="flex h-screen overflow-hidden" style={{ background: '#f7fdfc' }}>
      <style>{`html.dark .app-shell { background: #060b12 !important; } html.dark .app-main { background: #060b12 !important; }`}</style>
      <Sidebar />
      <div className="app-shell flex flex-col flex-1 overflow-hidden min-w-0" style={{ background: '#f7fdfc' }}>
        <TopBar />
        <main className="app-main flex-1 overflow-y-auto p-6" style={{ background: '#f7fdfc' }}>
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
