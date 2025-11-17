/**
 * Team and Permission Type Definitions
 *
 * Defines types for team management, user roles, phase assignments,
 * and permission checking in the phase-based access control system.
 */

import type { WorkspacePhase } from '@/lib/constants/workspace-phases'

// Re-export WorkspacePhase for convenience
export type { WorkspacePhase } from '@/lib/constants/workspace-phases'

/**
 * Team member role
 * - owner: Full control, created the team
 * - admin: Full access to team resources, can invite members
 * - member: Standard access with potential phase restrictions
 */
export type TeamRole = 'owner' | 'admin' | 'member'

/**
 * User phase assignment from database
 *
 * Represents a user's permission to work on a specific phase in a workspace.
 * Users can have multiple phase assignments per workspace.
 */
export interface UserPhaseAssignment {
  /** Unique assignment ID (timestamp-based) */
  id: string

  /** Team this assignment belongs to */
  team_id: string

  /** Workspace this assignment applies to */
  workspace_id: string

  /** User being assigned */
  user_id: string

  /** Phase the user is assigned to */
  phase: WorkspacePhase

  /** Whether user can edit items in this phase (vs view-only) */
  can_edit: boolean

  /** Whether user is a lead for this phase (can invite/manage users in this phase) */
  is_lead: boolean

  /** User ID who created this assignment */
  assigned_by: string

  /** When assignment was created */
  assigned_at: string

  /** Optional notes about this assignment */
  notes?: string | null
}

/**
 * Team member with nested user data
 */
export interface TeamMember {
  /** Member record ID */
  id: string

  /** User ID from auth.users */
  user_id: string

  /** Team ID */
  team_id: string

  /** Member role in this team */
  role: TeamRole

  /** When user joined the team */
  joined_at: string

  /** Nested user profile data */
  users: {
    email: string
    name: string | null
  } | null
}

/**
 * Team member with phase assignments included
 *
 * Used when displaying team members with their current phase permissions.
 */
export interface TeamMemberWithPhases extends TeamMember {
  /** All phase assignments for this user across workspaces */
  phase_assignments?: UserPhaseAssignment[]
}

/**
 * Permission check result for a single phase
 *
 * Represents what actions a user can perform on items in a specific phase.
 */
export interface PhasePermission {
  /** Can view items in this phase (always true for team members) */
  can_view: boolean

  /** Can edit items in this phase (requires assignment or admin role) */
  can_edit: boolean

  /** Can delete items in this phase (same as can_edit) */
  can_delete: boolean
}

/**
 * Map of phase to permissions
 *
 * Complete permission set for a user across all 5 phases.
 * Used for efficient permission checks without repeated DB queries.
 */
export type UserPhasePermissions = Record<WorkspacePhase, PhasePermission>

/**
 * Phase assignment for invitation
 *
 * Used when inviting new team members to specify their initial phase access.
 */
export interface InvitationPhaseAssignment {
  /** Workspace ID to grant access to */
  workspace_id: string

  /** Phase to assign */
  phase: WorkspacePhase

  /** Whether user can edit in this phase */
  can_edit: boolean
}

/**
 * Team invitation with phase assignments
 *
 * Extends standard invitation with phase-based access control.
 */
export interface InvitationWithPhases {
  /** Invitation ID */
  id: string

  /** Team being invited to */
  team_id: string

  /** Email address of invitee */
  email: string

  /** Role they will have when accepted */
  role: 'admin' | 'member'

  /** Secure token for invitation link */
  token: string

  /** When invitation expires */
  expires_at: string

  /** User who sent invitation */
  invited_by: string

  /** Phase assignments to create upon acceptance */
  phase_assignments: InvitationPhaseAssignment[]
}

/**
 * Team with subscription data
 */
export interface Team {
  /** Team ID */
  id: string

  /** Team name */
  name: string

  /** When team was created */
  created_at: string

  /** Owner user ID */
  owner_id: string

  /** Current subscription plan */
  plan?: 'free' | 'pro' | null
}

/**
 * Filter type for work item filtering
 */
export type WorkItemFilterType = 'view' | 'edit'

/**
 * Permission badge configuration
 *
 * Visual indicator of user's permission level for a phase.
 */
export interface PhasePermissionBadge {
  /** Display label */
  label: string

  /** Tailwind color class */
  color: string

  /** Icon identifier */
  icon: 'lock' | 'unlock' | 'eye'
}

/**
 * Phase role type for display purposes
 *
 * Distinguishes between phase leads and contributors.
 */
export type PhaseRoleType = 'lead' | 'contributor'

/**
 * Phase role display information
 *
 * Contains formatted label and role type for UI display.
 */
export interface PhaseRoleDisplay {
  /** Phase this role applies to */
  phase: WorkspacePhase

  /** Role type (lead or contributor) */
  role: PhaseRoleType

  /** Display label (e.g., "Research Lead", "Execution Contributor") */
  label: string
}

/**
 * Helper to get phase role label
 *
 * Formats phase name and role type into a display-friendly label.
 *
 * @param phaseName - Human-readable phase name (e.g., "Research", "Planning")
 * @param isLead - Whether user is a lead for this phase
 * @returns Formatted label (e.g., "Research Lead" or "Planning Contributor")
 */
export function getPhaseRoleLabel(
  phaseName: string,
  isLead: boolean
): string {
  return `${phaseName} ${isLead ? 'Lead' : 'Contributor'}`
}
