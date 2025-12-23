/**
 * Review Process Configuration and Utilities
 *
 * Provides a detached review process for work items that can be
 * optionally enabled to require stakeholder approval before
 * phase transitions.
 *
 * @module lib/phase/review-process
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Review status values
 */
export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ReviewStatus = typeof REVIEW_STATUSES[number]

/**
 * Review action types
 */
export const REVIEW_ACTIONS = ['request', 'approve', 'reject', 'cancel'] as const
export type ReviewAction = typeof REVIEW_ACTIONS[number]

/**
 * Team member roles that can interact with reviews
 */
export type ReviewerRole = 'owner' | 'admin' | 'member' | 'viewer'

/**
 * Work item data needed for review checks
 */
export interface ReviewableWorkItem {
  id: string
  type: string
  phase: string
  review_enabled?: boolean
  review_status?: ReviewStatus | null
  review_requested_at?: string | null
  review_completed_at?: string | null
  review_reason?: string | null
}

/**
 * Review action result
 */
export interface ReviewActionResult {
  success: boolean
  newStatus: ReviewStatus | null
  message: string
  timestamp: string
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Review process configuration
 */
export const REVIEW_CONFIG = {
  /**
   * Valid review statuses
   */
  statuses: REVIEW_STATUSES,

  /**
   * Valid status transitions
   */
  transitions: {
    pending: ['approved', 'rejected'] as ReviewStatus[],
    approved: [] as ReviewStatus[], // Terminal
    rejected: ['pending'] as ReviewStatus[], // Can re-request
  } as Record<ReviewStatus, ReviewStatus[]>,

  /**
   * Role-based permissions for review actions
   */
  permissions: {
    /** Who can request a review */
    request: ['owner', 'admin', 'member'] as ReviewerRole[],
    /** Who can approve a review */
    approve: ['owner', 'admin'] as ReviewerRole[],
    /** Who can reject a review */
    reject: ['owner', 'admin'] as ReviewerRole[],
    /** Who can cancel a pending review */
    cancel: ['owner', 'admin', 'member'] as ReviewerRole[],
    /** Who can toggle review_enabled */
    toggleReview: ['owner', 'admin'] as ReviewerRole[],
  },

  /**
   * Work item types that support reviews
   * Note: Enhancement is a flag on features, not a separate type
   */
  supportedTypes: ['bug', 'feature'] as string[],

  /**
   * Phases where review can be requested (by type)
   * Note: Enhancement is a flag on features, not a separate type
   */
  reviewablePhases: {
    feature: ['build', 'refine'], // Includes is_enhancement features
    bug: ['fixing'],
    concept: [], // Concepts don't have reviews
  } as Record<string, string[]>,

  /**
   * Phases that are blocked until review is approved
   * Note: Enhancement is a flag on features, not a separate type
   */
  blockedByReviewPhases: {
    feature: ['launch'], // Includes is_enhancement features
    bug: ['verified'],
    concept: [],
  } as Record<string, string[]>,
} as const

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

/**
 * Check if a user role can perform a review action
 */
export function canPerformReviewAction(
  action: ReviewAction,
  role: ReviewerRole
): boolean {
  const allowedRoles = REVIEW_CONFIG.permissions[action]
  return allowedRoles?.includes(role) ?? false
}

/**
 * Check if a user can request a review for a work item
 */
export function canRequestReview(
  workItem: ReviewableWorkItem,
  role: ReviewerRole
): boolean {
  // Must have permission
  if (!canPerformReviewAction('request', role)) {
    return false
  }

  // Must be a supported type
  if (!REVIEW_CONFIG.supportedTypes.includes(workItem.type)) {
    return false
  }

  // Must be in a reviewable phase for this type
  const reviewablePhases = REVIEW_CONFIG.reviewablePhases[workItem.type] || []
  if (!reviewablePhases.includes(workItem.phase)) {
    return false
  }

  // Review must be enabled
  if (!workItem.review_enabled) {
    return false
  }

  // Must not already have a pending or approved review
  if (workItem.review_status === 'pending' || workItem.review_status === 'approved') {
    return false
  }

  return true
}

/**
 * Check if a user can approve a review
 */
export function canApproveReview(
  workItem: ReviewableWorkItem,
  role: ReviewerRole
): boolean {
  // Must have permission
  if (!canPerformReviewAction('approve', role)) {
    return false
  }

  // Must have a pending review
  if (workItem.review_status !== 'pending') {
    return false
  }

  return true
}

/**
 * Check if a user can reject a review
 */
export function canRejectReview(
  workItem: ReviewableWorkItem,
  role: ReviewerRole
): boolean {
  // Must have permission
  if (!canPerformReviewAction('reject', role)) {
    return false
  }

  // Must have a pending review
  if (workItem.review_status !== 'pending') {
    return false
  }

  return true
}

/**
 * Check if a user can cancel a pending review
 */
export function canCancelReview(
  workItem: ReviewableWorkItem,
  role: ReviewerRole
): boolean {
  // Must have permission
  if (!canPerformReviewAction('cancel', role)) {
    return false
  }

  // Must have a pending review
  if (workItem.review_status !== 'pending') {
    return false
  }

  return true
}

/**
 * Check if a user can toggle review_enabled
 */
export function canToggleReviewEnabled(role: ReviewerRole): boolean {
  const allowedRoles = REVIEW_CONFIG.permissions.toggleReview
  return allowedRoles.includes(role)
}

// ============================================================================
// REVIEW STATE CHECKS
// ============================================================================

/**
 * Check if a work item type supports reviews
 */
export function supportsReview(type: string): boolean {
  return REVIEW_CONFIG.supportedTypes.includes(type)
}

/**
 * Check if a phase is reviewable for a work item type
 */
export function isReviewablePhase(type: string, phase: string): boolean {
  const phases = REVIEW_CONFIG.reviewablePhases[type] || []
  return phases.includes(phase)
}

/**
 * Check if a phase transition is blocked by review
 */
export function isPhaseBlockedByReview(
  workItem: ReviewableWorkItem,
  targetPhase: string
): boolean {
  // If review is not enabled, nothing is blocked
  if (!workItem.review_enabled) {
    return false
  }

  // Check if target phase is blocked for this type
  const blockedPhases = REVIEW_CONFIG.blockedByReviewPhases[workItem.type] || []
  if (!blockedPhases.includes(targetPhase)) {
    return false
  }

  // Blocked unless review is approved
  return workItem.review_status !== 'approved'
}

/**
 * Get blockers preventing phase transition due to review
 */
export function getReviewBlockers(
  workItem: ReviewableWorkItem,
  targetPhase: string
): string[] {
  const blockers: string[] = []

  if (!workItem.review_enabled) {
    return blockers
  }

  const blockedPhases = REVIEW_CONFIG.blockedByReviewPhases[workItem.type] || []
  if (!blockedPhases.includes(targetPhase)) {
    return blockers
  }

  if (!workItem.review_status) {
    blockers.push('Review has not been requested yet')
  } else if (workItem.review_status === 'pending') {
    blockers.push('Review is pending approval')
  } else if (workItem.review_status === 'rejected') {
    blockers.push('Review was rejected - please request a new review')
  }

  return blockers
}

/**
 * Check if review is complete (approved or not required)
 */
export function isReviewComplete(workItem: ReviewableWorkItem): boolean {
  if (!workItem.review_enabled) {
    return true
  }
  return workItem.review_status === 'approved'
}

// ============================================================================
// REVIEW STATUS HELPERS
// ============================================================================

/**
 * Get display label for review status
 */
export function getReviewStatusLabel(status: ReviewStatus | null): string {
  if (!status) return 'Not Requested'

  const labels: Record<ReviewStatus, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
  }
  return labels[status] || 'Unknown'
}

/**
 * Get status color for review status
 */
export function getReviewStatusColor(status: ReviewStatus | null): {
  bg: string
  text: string
  border: string
} {
  const colors: Record<ReviewStatus | 'none', { bg: string; text: string; border: string }> = {
    none: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  }
  return colors[status || 'none']
}

/**
 * Get allowed transitions from current status
 */
export function getAllowedTransitions(status: ReviewStatus | null): ReviewStatus[] {
  if (!status) return ['pending']
  return REVIEW_CONFIG.transitions[status] || []
}

// ============================================================================
// REVIEW ACTION EXECUTION
// ============================================================================

/**
 * Validate a review action before executing
 */
export function validateReviewAction(
  workItem: ReviewableWorkItem,
  action: ReviewAction,
  role: ReviewerRole
): { valid: boolean; error?: string } {
  switch (action) {
    case 'request':
      if (!canRequestReview(workItem, role)) {
        return { valid: false, error: 'Cannot request review in current state' }
      }
      break
    case 'approve':
      if (!canApproveReview(workItem, role)) {
        return { valid: false, error: 'Cannot approve review - no pending review or insufficient permissions' }
      }
      break
    case 'reject':
      if (!canRejectReview(workItem, role)) {
        return { valid: false, error: 'Cannot reject review - no pending review or insufficient permissions' }
      }
      break
    case 'cancel':
      if (!canCancelReview(workItem, role)) {
        return { valid: false, error: 'Cannot cancel review - no pending review or insufficient permissions' }
      }
      break
    default:
      return { valid: false, error: 'Unknown review action' }
  }

  return { valid: true }
}

/**
 * Get the new status after a review action
 */
export function getStatusAfterAction(action: ReviewAction): ReviewStatus | null {
  switch (action) {
    case 'request':
      return 'pending'
    case 'approve':
      return 'approved'
    case 'reject':
      return 'rejected'
    case 'cancel':
      return null
    default:
      return null
  }
}
