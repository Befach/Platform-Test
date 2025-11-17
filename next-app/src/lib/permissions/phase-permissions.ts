/**
 * Phase Permission Helper Functions
 *
 * Provides utilities for checking user permissions in phase-based access control system.
 * Integrates with user_phase_assignments table and team member roles.
 */

import { createClient } from '@/lib/supabase/client'
import type { WorkspacePhase } from '@/lib/constants/workspace-phases'
import type { TeamRole, UserPhaseAssignment } from '@/lib/types/team'

/**
 * Permission result for a single phase
 */
export interface PhasePermissionResult {
  /** Can view items in this phase (always true for team members) */
  can_view: boolean
  /** Can edit items in this phase */
  can_edit: boolean
  /** Can delete items in this phase (same as can_edit) */
  can_delete: boolean
  /** Is a phase lead (can manage team in this phase) */
  is_lead: boolean
  /** Can manage phase assignments for this phase */
  can_manage_assignments: boolean
}

/**
 * Complete permissions for all phases in a workspace
 */
export type WorkspacePhasePermissions = Record<WorkspacePhase, PhasePermissionResult>

/**
 * Check if user is an owner or admin of a team
 */
export async function isTeamAdminOrOwner(
  userId: string,
  teamId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data: membership, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .single()

  if (error || !membership) {
    return false
  }

  return membership.role === 'owner' || membership.role === 'admin'
}

/**
 * Check if user is a phase lead for a specific phase in a workspace
 */
export async function isPhaseLeadForPhase(
  userId: string,
  workspaceId: string,
  phase: WorkspacePhase
): Promise<boolean> {
  const supabase = createClient()

  const { data: assignment, error } = await supabase
    .from('user_phase_assignments')
    .select('is_lead')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('phase', phase)
    .eq('is_lead', true)
    .maybeSingle()

  if (error || !assignment) {
    return false
  }

  return assignment.is_lead
}

/**
 * Check if user can edit items in a specific phase
 * Returns true if:
 * - User is owner/admin
 * - User is a phase lead for this phase
 * - User is a contributor (has can_edit permission) for this phase
 */
export async function canEditInPhase(
  userId: string,
  workspaceId: string,
  teamId: string,
  phase: WorkspacePhase
): Promise<boolean> {
  const supabase = createClient()

  // Check if user is owner/admin
  const isAdmin = await isTeamAdminOrOwner(userId, teamId)
  if (isAdmin) {
    return true
  }

  // Check phase assignment
  const { data: assignment, error } = await supabase
    .from('user_phase_assignments')
    .select('can_edit, is_lead')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .eq('phase', phase)
    .maybeSingle()

  if (error || !assignment) {
    return false
  }

  return assignment.can_edit || assignment.is_lead
}

/**
 * Check if user can manage team assignments for a specific phase
 * Returns true if:
 * - User is owner/admin
 * - User is a phase lead for this phase
 */
export async function canManagePhaseAssignments(
  userId: string,
  workspaceId: string,
  teamId: string,
  phase: WorkspacePhase
): Promise<boolean> {
  const supabase = createClient()

  // Check if user is owner/admin
  const isAdmin = await isTeamAdminOrOwner(userId, teamId)
  if (isAdmin) {
    return true
  }

  // Check if user is phase lead
  return await isPhaseLeadForPhase(userId, workspaceId, phase)
}

/**
 * Get all phase assignments for a user in a workspace
 */
export async function getUserPhaseAssignments(
  userId: string,
  workspaceId: string
): Promise<UserPhaseAssignment[]> {
  const supabase = createClient()

  const { data: assignments, error } = await supabase
    .from('user_phase_assignments')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)

  if (error || !assignments) {
    return []
  }

  return assignments as UserPhaseAssignment[]
}

/**
 * Get complete permissions for a user across all phases in a workspace
 */
export async function getWorkspacePhasePermissions(
  userId: string,
  workspaceId: string,
  teamId: string
): Promise<WorkspacePhasePermissions> {
  const supabase = createClient()

  // Check if user is owner/admin (full access to all phases)
  const isAdmin = await isTeamAdminOrOwner(userId, teamId)

  if (isAdmin) {
    // Admin has full access to all phases
    const fullAccess: PhasePermissionResult = {
      can_view: true,
      can_edit: true,
      can_delete: true,
      is_lead: true,
      can_manage_assignments: true,
    }

    return {
      research: fullAccess,
      planning: fullAccess,
      execution: fullAccess,
      review: fullAccess,
      complete: fullAccess,
    }
  }

  // Get all phase assignments for this user
  const { data: assignments } = await supabase
    .from('user_phase_assignments')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)

  // Build permission map
  const phases: WorkspacePhase[] = ['research', 'planning', 'execution', 'review', 'complete']
  const permissions: Partial<WorkspacePhasePermissions> = {}

  phases.forEach((phase) => {
    const assignment = assignments?.find((a) => a.phase === phase)

    if (assignment) {
      permissions[phase] = {
        can_view: true,
        can_edit: assignment.can_edit || assignment.is_lead,
        can_delete: assignment.can_edit || assignment.is_lead,
        is_lead: assignment.is_lead,
        can_manage_assignments: assignment.is_lead,
      }
    } else {
      // No assignment = view-only access
      permissions[phase] = {
        can_view: true,
        can_edit: false,
        can_delete: false,
        is_lead: false,
        can_manage_assignments: false,
      }
    }
  })

  return permissions as WorkspacePhasePermissions
}

/**
 * Get permission result for a single phase
 */
export async function getPhasePermission(
  userId: string,
  workspaceId: string,
  teamId: string,
  phase: WorkspacePhase
): Promise<PhasePermissionResult> {
  const permissions = await getWorkspacePhasePermissions(userId, workspaceId, teamId)
  return permissions[phase]
}

/**
 * Check if user has ANY edit permissions in ANY phase
 */
export async function hasAnyEditPermission(
  userId: string,
  workspaceId: string,
  teamId: string
): Promise<boolean> {
  const permissions = await getWorkspacePhasePermissions(userId, workspaceId, teamId)
  return Object.values(permissions).some((p) => p.can_edit)
}

/**
 * Check if user is a lead in ANY phase
 */
export async function isLeadInAnyPhase(
  userId: string,
  workspaceId: string,
  teamId: string
): Promise<boolean> {
  const permissions = await getWorkspacePhasePermissions(userId, workspaceId, teamId)
  return Object.values(permissions).some((p) => p.is_lead)
}

/**
 * Get count of phases user can edit in
 */
export async function getEditablePhaseCount(
  userId: string,
  workspaceId: string,
  teamId: string
): Promise<number> {
  const permissions = await getWorkspacePhasePermissions(userId, workspaceId, teamId)
  return Object.values(permissions).filter((p) => p.can_edit).length
}

/**
 * Get count of phases user is a lead in
 */
export async function getLeadPhaseCount(
  userId: string,
  workspaceId: string,
  teamId: string
): Promise<number> {
  const permissions = await getWorkspacePhasePermissions(userId, workspaceId, teamId)
  return Object.values(permissions).filter((p) => p.is_lead).length
}

/**
 * Get list of phases user can edit in
 */
export async function getEditablePhases(
  userId: string,
  workspaceId: string,
  teamId: string
): Promise<WorkspacePhase[]> {
  const permissions = await getWorkspacePhasePermissions(userId, workspaceId, teamId)
  return (Object.keys(permissions) as WorkspacePhase[]).filter(
    (phase) => permissions[phase].can_edit
  )
}

/**
 * Get list of phases user is a lead in
 */
export async function getLeadPhases(
  userId: string,
  workspaceId: string,
  teamId: string
): Promise<WorkspacePhase[]> {
  const permissions = await getWorkspacePhasePermissions(userId, workspaceId, teamId)
  return (Object.keys(permissions) as WorkspacePhase[]).filter(
    (phase) => permissions[phase].is_lead
  )
}
