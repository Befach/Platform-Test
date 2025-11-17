/**
 * Phase Permission Utilities
 *
 * Functions for checking and managing phase-based permissions.
 * Implements the core logic for the phase assignment access control system.
 */

import { createClient } from '@/lib/supabase/client'
import type { WorkspacePhase } from '@/lib/constants/workspace-phases'
import { PHASE_ORDER } from '@/lib/constants/workspace-phases'
import type {
  UserPhaseAssignment,
  PhasePermission,
  UserPhasePermissions,
  TeamRole,
  PhasePermissionBadge,
} from '@/lib/types/team'

/**
 * Get all phase assignments for a user in a workspace
 *
 * @param userId - User ID to get assignments for
 * @param workspaceId - Workspace ID to filter by
 * @returns Array of phase assignments
 */
export async function getUserPhaseAssignments(
  userId: string,
  workspaceId: string
): Promise<UserPhaseAssignment[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_phase_assignments')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .order('assigned_at', { ascending: false })

  if (error) {
    console.error('Error fetching phase assignments:', error)
    return []
  }

  return data || []
}

/**
 * Check if user has role that bypasses phase restrictions
 *
 * @param userId - User ID to check
 * @param teamId - Team ID to check membership in
 * @returns True if user is owner or admin
 */
export async function isUserAdminOrOwner(
  userId: string,
  teamId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return false
  }

  return data.role === 'owner' || data.role === 'admin'
}

/**
 * Get user's permissions for all phases in a workspace
 *
 * Returns a map of all 5 phases with their permission settings.
 * Owners and admins get full edit access to all phases.
 * Members get edit access only to assigned phases.
 * Phase leads get edit access and can manage team in their assigned phases.
 *
 * @param userId - User ID to get permissions for
 * @param workspaceId - Workspace ID to check
 * @param teamId - Team ID (for role check)
 * @returns Map of phase to permissions
 */
export async function getUserPhasePermissions(
  userId: string,
  workspaceId: string,
  teamId: string
): Promise<UserPhasePermissions> {
  // Default permissions: can view all, cannot edit any
  const defaultPermission: PhasePermission = {
    can_view: true,
    can_edit: false,
    can_delete: false,
  }

  const defaultPermissions: UserPhasePermissions = Object.fromEntries(
    PHASE_ORDER.map((phase) => [phase, { ...defaultPermission }])
  ) as UserPhasePermissions

  // Check if user is admin/owner (bypasses all restrictions)
  const isAdmin = await isUserAdminOrOwner(userId, teamId)

  if (isAdmin) {
    // Admins and owners can edit all phases
    return Object.fromEntries(
      PHASE_ORDER.map((phase) => [
        phase,
        { can_view: true, can_edit: true, can_delete: true },
      ])
    ) as UserPhasePermissions
  }

  // Get user's specific phase assignments
  const assignments = await getUserPhaseAssignments(userId, workspaceId)

  // Build permission map from assignments
  const permissions = { ...defaultPermissions }

  for (const assignment of assignments) {
    // Phase leads and contributors can edit
    if (assignment.can_edit || assignment.is_lead) {
      permissions[assignment.phase] = {
        can_view: true,
        can_edit: true,
        can_delete: true,
      }
    }
  }

  return permissions
}

/**
 * Check if user can edit a specific phase
 *
 * Quick check for a single phase without loading all permissions.
 * Use this when you only need to check one phase at a time.
 * Returns true for phase leads and contributors.
 *
 * @param userId - User ID to check
 * @param workspaceId - Workspace ID
 * @param teamId - Team ID (for role check)
 * @param phase - Phase to check
 * @returns True if user can edit items in this phase
 */
export async function canUserEditPhase(
  userId: string,
  workspaceId: string,
  teamId: string,
  phase: WorkspacePhase
): Promise<boolean> {
  // Check if admin/owner first (fastest path)
  const isAdmin = await isUserAdminOrOwner(userId, teamId)
  if (isAdmin) return true

  // Check for specific phase assignment
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_phase_assignments')
    .select('can_edit, is_lead')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('phase', phase)
    .maybeSingle()

  if (error || !data) {
    return false
  }

  return data.can_edit || data.is_lead
}

/**
 * Filter work items based on user's phase permissions
 *
 * Frontend helper for filtering items. Note: Actual security is enforced by RLS.
 * This is for UI filtering only.
 *
 * @param workItems - Array of work items to filter
 * @param calculatePhase - Function to determine which phase each item is in
 * @param userPermissions - User's permission map
 * @param filterType - 'view' returns all items, 'edit' returns only editable items
 * @returns Filtered array of work items
 */
export function filterWorkItemsByPhase<T extends { id: string }>(
  workItems: T[],
  calculatePhase: (item: T) => WorkspacePhase,
  userPermissions: UserPhasePermissions,
  filterType: 'view' | 'edit' = 'view'
): T[] {
  return workItems.filter((item) => {
    const phase = calculatePhase(item)
    const permission = userPermissions[phase]

    if (filterType === 'view') {
      // View filter: all team members can view all items
      return permission.can_view
    } else {
      // Edit filter: only return items user can edit
      return permission.can_edit
    }
  })
}

/**
 * Get phase badge color based on permission
 *
 * Returns UI configuration for displaying permission level.
 * Use this for visual indicators in the UI.
 *
 * @param phase - Phase to get badge for
 * @param permission - User's permission for this phase
 * @returns Badge configuration object
 */
export function getPhasePermissionBadge(
  phase: WorkspacePhase,
  permission: PhasePermission
): PhasePermissionBadge {
  if (permission.can_edit) {
    return {
      label: 'Can Edit',
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: 'unlock',
    }
  }

  if (permission.can_view) {
    return {
      label: 'View Only',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      icon: 'eye',
    }
  }

  return {
    label: 'No Access',
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: 'lock',
  }
}

/**
 * Check if user can perform action on work item
 *
 * Comprehensive permission check combining phase assignment and work item ownership.
 * Use this for action buttons (edit, delete, assign, etc.).
 *
 * @param userId - User performing the action
 * @param workspaceId - Workspace containing the item
 * @param teamId - Team ID
 * @param itemPhase - Phase the work item is currently in
 * @param action - Action to perform
 * @returns True if action is allowed
 */
export async function canUserPerformAction(
  userId: string,
  workspaceId: string,
  teamId: string,
  itemPhase: WorkspacePhase,
  action: 'view' | 'edit' | 'delete' | 'assign'
): Promise<boolean> {
  const permissions = await getUserPhasePermissions(userId, workspaceId, teamId)
  const phasePermission = permissions[itemPhase]

  switch (action) {
    case 'view':
      return phasePermission.can_view

    case 'edit':
    case 'assign':
      return phasePermission.can_edit

    case 'delete':
      return phasePermission.can_delete

    default:
      return false
  }
}

/**
 * Get summary of user's phase access
 *
 * Returns human-readable summary of which phases user can access.
 * Useful for permission displays and debugging.
 *
 * @param permissions - User's permission map
 * @returns Object with counts and lists
 */
export function getPhaseAccessSummary(permissions: UserPhasePermissions): {
  total_phases: number
  editable_phases: number
  view_only_phases: number
  editable_phase_names: WorkspacePhase[]
  view_only_phase_names: WorkspacePhase[]
} {
  const editable: WorkspacePhase[] = []
  const viewOnly: WorkspacePhase[] = []

  for (const phase of PHASE_ORDER) {
    const permission = permissions[phase]
    if (permission.can_edit) {
      editable.push(phase)
    } else if (permission.can_view) {
      viewOnly.push(phase)
    }
  }

  return {
    total_phases: PHASE_ORDER.length,
    editable_phases: editable.length,
    view_only_phases: viewOnly.length,
    editable_phase_names: editable,
    view_only_phase_names: viewOnly,
  }
}

/**
 * Validate phase assignment data
 *
 * Check if phase assignment is valid before creating/updating.
 * Prevents invalid data from being saved.
 *
 * @param assignment - Partial assignment data to validate
 * @returns Validation result
 */
export function validatePhaseAssignment(assignment: {
  phase: string
  can_edit: boolean
  workspace_id: string
  user_id: string
}): { valid: boolean; error?: string } {
  // Check if phase is valid
  if (!PHASE_ORDER.includes(assignment.phase as WorkspacePhase)) {
    return {
      valid: false,
      error: `Invalid phase: ${assignment.phase}. Must be one of: ${PHASE_ORDER.join(', ')}`,
    }
  }

  // Check required fields
  if (!assignment.workspace_id || !assignment.user_id) {
    return {
      valid: false,
      error: 'workspace_id and user_id are required',
    }
  }

  // can_edit must be boolean
  if (typeof assignment.can_edit !== 'boolean') {
    return {
      valid: false,
      error: 'can_edit must be a boolean',
    }
  }

  return { valid: true }
}
