/**
 * Phase Permissions Hook
 *
 * React hook for checking user's phase-based permissions in a workspace.
 * Provides efficient permission checking with caching and real-time updates.
 *
 * Usage:
 * ```tsx
 * const { permissions, canEdit, canView, isLoading } = usePhasePermissions({
 *   workspaceId: 'workspace_123',
 *   teamId: 'team_456'
 * });
 *
 * if (canEdit('execution')) {
 *   // Show edit UI
 * }
 * ```
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserPhasePermissions, canUserEditPhase } from '@/lib/utils/phase-permissions'
import type { UserPhasePermissions, WorkspacePhase } from '@/lib/types/team'

interface UsePhasePermissionsParams {
  workspaceId: string
  teamId: string
}

interface UsePhasePermissionsReturn {
  /** Full permission map for all phases */
  permissions: UserPhasePermissions | null

  /** Check if user can edit a specific phase */
  canEdit: (phase: WorkspacePhase) => boolean

  /** Check if user can view a specific phase (always true for team members) */
  canView: (phase: WorkspacePhase) => boolean

  /** Check if user can delete items in a specific phase */
  canDelete: (phase: WorkspacePhase) => boolean

  /** Loading state */
  isLoading: boolean

  /** Error state */
  error: Error | null

  /** Manually refresh permissions */
  refresh: () => Promise<void>
}

/**
 * Hook to get user's phase permissions for a workspace
 *
 * Automatically refreshes when:
 * - Phase assignments change (via Supabase real-time)
 * - User role changes
 * - Workspace or team changes
 *
 * @param params - Workspace and team IDs
 * @returns Permission checking utilities and state
 */
export function usePhasePermissions({
  workspaceId,
  teamId,
}: UsePhasePermissionsParams): UsePhasePermissionsReturn {
  const [permissions, setPermissions] = useState<UserPhasePermissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  // Load permissions function
  const loadPermissions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('No authenticated user')
      }

      // Fetch permissions
      const userPermissions = await getUserPhasePermissions(
        user.id,
        workspaceId,
        teamId
      )

      setPermissions(userPermissions)
    } catch (err) {
      console.error('Error loading phase permissions:', err)
      setError(err instanceof Error ? err : new Error('Failed to load permissions'))
    } finally {
      setIsLoading(false)
    }
  }

  // Load permissions on mount and when dependencies change
  useEffect(() => {
    loadPermissions()
  }, [workspaceId, teamId])

  // Subscribe to real-time updates for phase assignments
  useEffect(() => {
    const channel = supabase
      .channel(`phase-permissions-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_phase_assignments',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Reload permissions when assignments change
          loadPermissions()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          // Reload permissions when team roles change
          loadPermissions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, teamId])

  // Permission check helpers
  const canEdit = (phase: WorkspacePhase): boolean => {
    if (!permissions) return false
    return permissions[phase]?.can_edit ?? false
  }

  const canView = (phase: WorkspacePhase): boolean => {
    if (!permissions) return false
    return permissions[phase]?.can_view ?? false
  }

  const canDelete = (phase: WorkspacePhase): boolean => {
    if (!permissions) return false
    return permissions[phase]?.can_delete ?? false
  }

  return {
    permissions,
    canEdit,
    canView,
    canDelete,
    isLoading,
    error,
    refresh: loadPermissions,
  }
}

/**
 * Hook to check a single phase permission without loading all permissions
 *
 * More efficient when you only need to check one phase at a time.
 *
 * Usage:
 * ```tsx
 * const { canEdit, isLoading } = useCanEditPhase({
 *   workspaceId: 'workspace_123',
 *   teamId: 'team_456',
 *   phase: 'execution'
 * });
 * ```
 */
export function useCanEditPhase({
  workspaceId,
  teamId,
  phase,
}: UsePhasePermissionsParams & { phase: WorkspacePhase }) {
  const [canEdit, setCanEdit] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          throw new Error('No authenticated user')
        }

        const hasPermission = await canUserEditPhase(
          user.id,
          workspaceId,
          teamId,
          phase
        )

        setCanEdit(hasPermission)
      } catch (err) {
        console.error('Error checking phase permission:', err)
        setError(err instanceof Error ? err : new Error('Failed to check permission'))
      } finally {
        setIsLoading(false)
      }
    }

    checkPermission()
  }, [workspaceId, teamId, phase])

  return { canEdit, isLoading, error }
}
