/**
 * React Hook for Phase Permissions
 *
 * Provides reactive access to user's phase permissions in a workspace.
 * Handles loading state, error handling, and permission checking.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserPhasePermissions } from '@/lib/utils/phase-permissions'
import type { UserPhasePermissions, WorkspacePhase } from '@/lib/types/team'

interface UsePhasePermissionsOptions {
  /** Workspace ID to check permissions for */
  workspaceId: string
  /** Team ID for role checking */
  teamId: string
  /** Whether to enable the hook (default: true) */
  enabled?: boolean
}

interface UsePhasePermissionsReturn {
  /** Permission map for all phases */
  permissions: UserPhasePermissions | null
  /** Whether permissions are being loaded */
  loading: boolean
  /** Error if permission loading failed */
  error: Error | null
  /** Check if user can edit a specific phase */
  canEdit: (phase: WorkspacePhase) => boolean
  /** Check if user can view a specific phase */
  canView: (phase: WorkspacePhase) => boolean
  /** Check if user can delete items in a specific phase */
  canDelete: (phase: WorkspacePhase) => boolean
  /** Manually refresh permissions */
  refetch: () => Promise<void>
}

/**
 * Hook to get user's phase permissions for a workspace
 *
 * @example
 * ```tsx
 * const { permissions, loading, canEdit } = usePhasePermissions({
 *   workspaceId: 'workspace_123',
 *   teamId: 'team_456'
 * })
 *
 * if (loading) return <Spinner />
 * if (!canEdit('execution')) return <LockedMessage />
 *
 * return <EditButton />
 * ```
 */
export function usePhasePermissions({
  workspaceId,
  teamId,
  enabled = true,
}: UsePhasePermissionsOptions): UsePhasePermissionsReturn {
  const [permissions, setPermissions] = useState<UserPhasePermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Load permissions from database
   */
  const loadPermissions = useCallback(async () => {
    if (!enabled || !workspaceId || !teamId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get current user
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Fetch permissions
      const perms = await getUserPhasePermissions(user.id, workspaceId, teamId)
      setPermissions(perms)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load permissions')
      setError(error)
      console.error('Error loading phase permissions:', error)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, teamId, enabled])

  /**
   * Load permissions on mount and when dependencies change
   */
  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  /**
   * Check if user can edit a specific phase
   */
  const canEdit = useCallback(
    (phase: WorkspacePhase): boolean => {
      return permissions?.[phase]?.can_edit ?? false
    },
    [permissions]
  )

  /**
   * Check if user can view a specific phase
   */
  const canView = useCallback(
    (phase: WorkspacePhase): boolean => {
      return permissions?.[phase]?.can_view ?? false
    },
    [permissions]
  )

  /**
   * Check if user can delete items in a specific phase
   */
  const canDelete = useCallback(
    (phase: WorkspacePhase): boolean => {
      return permissions?.[phase]?.can_delete ?? false
    },
    [permissions]
  )

  /**
   * Manually refresh permissions
   */
  const refetch = useCallback(async (): Promise<void> => {
    await loadPermissions()
  }, [loadPermissions])

  return {
    permissions,
    loading,
    error,
    canEdit,
    canView,
    canDelete,
    refetch,
  }
}

/**
 * Hook to check if current user is admin or owner
 *
 * Simpler hook for checking bypass permissions.
 *
 * @example
 * ```tsx
 * const { isAdmin, loading } = useIsAdmin({ teamId: 'team_123' })
 *
 * if (isAdmin) {
 *   return <AdminPanel />
 * }
 * ```
 */
export function useIsAdmin({ teamId }: { teamId: string }): {
  isAdmin: boolean
  loading: boolean
  error: Error | null
} {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsAdmin(false)
          return
        }

        // Check user role in team
        const { data, error: roleError } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', teamId)
          .eq('user_id', user.id)
          .single()

        if (roleError || !data) {
          setIsAdmin(false)
          return
        }

        setIsAdmin(data.role === 'owner' || data.role === 'admin')
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to check admin status')
        setError(error)
        console.error('Error checking admin status:', error)
      } finally {
        setLoading(false)
      }
    }

    if (teamId) {
      checkAdminStatus()
    }
  }, [teamId])

  return { isAdmin, loading, error }
}

/**
 * Hook to get user's phase assignments
 *
 * Returns raw phase assignment data for a workspace.
 * Use this when you need assignment details (notes, assigned_by, etc).
 *
 * @example
 * ```tsx
 * const { assignments, loading } = usePhaseAssignments({
 *   workspaceId: 'workspace_123'
 * })
 *
 * return (
 *   <ul>
 *     {assignments.map(a => (
 *       <li key={a.id}>
 *         {a.phase}: {a.can_edit ? 'Edit' : 'View'}
 *         {a.notes && <p>{a.notes}</p>}
 *       </li>
 *     ))}
 *   </ul>
 * )
 * ```
 */
export function usePhaseAssignments({ workspaceId }: { workspaceId: string }): {
  assignments: Array<{
    id: string
    phase: WorkspacePhase
    can_edit: boolean
    assigned_by: string
    assigned_at: string
    notes: string | null
  }>
  loading: boolean
  error: Error | null
} {
  const [assignments, setAssignments] = useState<
    Array<{
      id: string
      phase: WorkspacePhase
      can_edit: boolean
      assigned_by: string
      assigned_at: string
      notes: string | null
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchAssignments() {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error('User not authenticated')
        }

        const { data, error: fetchError } = await supabase
          .from('user_phase_assignments')
          .select('id, phase, can_edit, assigned_by, assigned_at, notes')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .order('assigned_at', { ascending: false })

        if (fetchError) throw fetchError

        setAssignments(data || [])
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch assignments')
        setError(error)
        console.error('Error fetching phase assignments:', error)
      } finally {
        setLoading(false)
      }
    }

    if (workspaceId) {
      fetchAssignments()
    }
  }, [workspaceId])

  return { assignments, loading, error }
}
