import { useAuthStore } from '@/lib/authStore'
import { useWorkspaces } from './useWorkspaces'

export function useActiveWorkspace() {
  const activeId = useAuthStore(s => s.activeWorkspaceId)
  const { data: workspaces } = useWorkspaces()
  const active = workspaces?.find(w => w.id === activeId) ?? null
  return {
    id: activeId,
    name: active?.name ?? null,
    role: active?.role ?? null,
    orgId: active?.orgId ?? null,
    workspace: active,
  }
}
