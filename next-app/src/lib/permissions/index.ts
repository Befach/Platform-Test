/**
 * Phase Permission System - Unified Exports
 *
 * Centralized exports for the phase-based permission system.
 * Import everything you need from this single file.
 */

// ============================================================================
// Types
// ============================================================================

export type {
  WorkspacePhase,
  TeamRole,
  UserPhaseAssignment,
  TeamMember,
  TeamMemberWithPhases,
  PhasePermission,
  UserPhasePermissions,
  InvitationPhaseAssignment,
  InvitationWithPhases,
  Team,
  WorkItemFilterType,
  PhasePermissionBadge,
} from '@/lib/types/team'

// ============================================================================
// Utility Functions
// ============================================================================

export {
  getUserPhaseAssignments,
  getUserPhasePermissions,
  canUserEditPhase,
  isUserAdminOrOwner,
  filterWorkItemsByPhase,
  getPhasePermissionBadge,
  canUserPerformAction,
  getPhaseAccessSummary,
  validatePhaseAssignment,
} from '@/lib/utils/phase-permissions'

// ============================================================================
// React Hooks
// ============================================================================

export {
  usePhasePermissions,
  useIsAdmin,
  usePhaseAssignments,
} from '@/lib/hooks/use-phase-permissions'

// ============================================================================
// Constants
// ============================================================================

export {
  PHASE_CONFIG,
  PHASE_ORDER,
  PHASE_PERMISSIONS,
  calculateWorkItemPhase,
  calculatePhaseDistribution,
} from '@/lib/constants/workspace-phases'

export type { PhaseConfig } from '@/lib/constants/workspace-phases'

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Check permission in client component
 *
 * ```tsx
 * import { usePhasePermissions, calculateWorkItemPhase } from '@/lib/permissions'
 *
 * function WorkItemCard({ workItem, workspaceId, teamId }) {
 *   const { canEdit, loading } = usePhasePermissions({ workspaceId, teamId })
 *   const phase = calculateWorkItemPhase(workItem)
 *
 *   if (loading) return <Skeleton />
 *
 *   return (
 *     <Card>
 *       {canEdit(phase) ? <EditButton /> : <ViewOnlyBadge />}
 *     </Card>
 *   )
 * }
 * ```
 */

/**
 * Example 2: Protect API route
 *
 * ```tsx
 * import { canUserEditPhase, calculateWorkItemPhase } from '@/lib/permissions'
 *
 * export async function PATCH(request: Request) {
 *   const phase = calculateWorkItemPhase(workItem)
 *   const canEdit = await canUserEditPhase(userId, workspaceId, teamId, phase)
 *
 *   if (!canEdit) {
 *     return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 *   }
 *
 *   // Proceed with update...
 * }
 * ```
 */

/**
 * Example 3: Filter items by permission
 *
 * ```tsx
 * import {
 *   usePhasePermissions,
 *   filterWorkItemsByPhase,
 *   calculateWorkItemPhase
 * } from '@/lib/permissions'
 *
 * function EditableList({ workItems, workspaceId, teamId }) {
 *   const { permissions } = usePhasePermissions({ workspaceId, teamId })
 *
 *   const editableItems = filterWorkItemsByPhase(
 *     workItems,
 *     calculateWorkItemPhase,
 *     permissions!,
 *     'edit'
 *   )
 *
 *   return <>{editableItems.map(item => <WorkItemCard {...item} />)}</>
 * }
 * ```
 */

/**
 * Example 4: Admin check
 *
 * ```tsx
 * import { useIsAdmin } from '@/lib/permissions'
 *
 * function AdminPanel({ teamId }) {
 *   const { isAdmin, loading } = useIsAdmin({ teamId })
 *
 *   if (!isAdmin) return <AccessDenied />
 *
 *   return <ManageTeam teamId={teamId} />
 * }
 * ```
 */

/**
 * Example 5: Show permission badges
 *
 * ```tsx
 * import {
 *   usePhasePermissions,
 *   getPhasePermissionBadge,
 *   PHASE_ORDER
 * } from '@/lib/permissions'
 *
 * function PhaseAccessPanel({ workspaceId, teamId }) {
 *   const { permissions } = usePhasePermissions({ workspaceId, teamId })
 *
 *   return (
 *     <div>
 *       {PHASE_ORDER.map(phase => {
 *         const badge = getPhasePermissionBadge(phase, permissions[phase])
 *         return <Badge key={phase} className={badge.color}>{badge.label}</Badge>
 *       })}
 *     </div>
 *   )
 * }
 * ```
 */
