/**
 * Admin Role Check Hook
 *
 * React hook for checking if current user is admin or owner in a team.
 * Admins and owners bypass phase-based restrictions.
 *
 * Usage:
 * ```tsx
 * const { isAdmin, isLoading } = useIsAdmin({ teamId: 'team_456' });
 *
 * if (isAdmin) {
 *   // Show admin-only UI
 * }
 * ```
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isUserAdminOrOwner } from '@/lib/utils/phase-permissions'
import type { TeamRole } from '@/lib/types/team'

interface UseIsAdminParams {
  teamId: string
}

interface UseIsAdminReturn {
  /** Whether user is admin or owner */
  isAdmin: boolean

  /** User's specific role */
  role: TeamRole | null

  /** Loading state */
  isLoading: boolean

  /** Error state */
  error: Error | null

  /** Manually refresh role check */
  refresh: () => Promise<void>
}

/**
 * Hook to check if user is admin or owner
 *
 * Automatically refreshes when team membership changes.
 *
 * @param params - Team ID to check
 * @returns Admin status and utilities
 */
export function useIsAdmin({ teamId }: UseIsAdminParams): UseIsAdminReturn {
  const [isAdmin, setIsAdmin] = useState(false)
  const [role, setRole] = useState<TeamRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  const checkAdminStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('No authenticated user')
      }

      // Check if admin/owner
      const adminStatus = await isUserAdminOrOwner(user.id, teamId)
      setIsAdmin(adminStatus)

      // Get specific role
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single()

      if (memberError) {
        throw memberError
      }

      setRole(memberData?.role ?? null)
    } catch (err) {
      console.error('Error checking admin status:', err)
      setError(err instanceof Error ? err : new Error('Failed to check admin status'))
      setIsAdmin(false)
      setRole(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Load admin status on mount and when team changes
  useEffect(() => {
    checkAdminStatus()
  }, [teamId])

  // Subscribe to real-time updates for team membership changes
  useEffect(() => {
    const channel = supabase
      .channel(`team-admin-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          // Reload admin status when team roles change
          checkAdminStatus()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [teamId])

  return {
    isAdmin,
    role,
    isLoading,
    error,
    refresh: checkAdminStatus,
  }
}

/**
 * Hook to check if user has a specific role
 *
 * More flexible than useIsAdmin if you need to check specific roles.
 *
 * Usage:
 * ```tsx
 * const { hasRole, isLoading } = useHasRole({
 *   teamId: 'team_456',
 *   requiredRole: 'owner'
 * });
 * ```
 */
export function useHasRole({
  teamId,
  requiredRole,
}: {
  teamId: string
  requiredRole: TeamRole | TeamRole[]
}) {
  const { role, isLoading, error } = useIsAdmin({ teamId })

  const hasRole = (): boolean => {
    if (!role) return false

    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role)
    }

    return role === requiredRole
  }

  return {
    hasRole: hasRole(),
    currentRole: role,
    isLoading,
    error,
  }
}
