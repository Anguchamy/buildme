import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Workspace } from '@/types'

interface WorkspaceState {
  currentWorkspaceId: number | null
  workspaces: Workspace[]
  setCurrentWorkspace: (id: number) => void
  setWorkspaces: (workspaces: Workspace[]) => void
  getCurrentWorkspace: () => Workspace | undefined
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      currentWorkspaceId: null,
      workspaces: [],

      setCurrentWorkspace: (id) => set({ currentWorkspaceId: id }),

      setWorkspaces: (workspaces) => {
        set({ workspaces })
        // Auto-select first workspace if none selected
        const { currentWorkspaceId } = get()
        if (!currentWorkspaceId && workspaces.length > 0) {
          set({ currentWorkspaceId: workspaces[0].id })
        }
      },

      getCurrentWorkspace: () => {
        const { currentWorkspaceId, workspaces } = get()
        return workspaces.find((w) => w.id === currentWorkspaceId)
      },
    }),
    {
      name: 'buildme-workspace',
      partialize: (state) => ({
        currentWorkspaceId: state.currentWorkspaceId,
      }),
    }
  )
)
