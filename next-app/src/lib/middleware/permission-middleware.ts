/**
 * Permission Middleware for API Routes
 *
 * Server-side authorization layer that enforces phase-based permissions
 * on all work item mutations (create, update, delete).
 *
 * Security Architecture:
 * 1. Client UI: Permission guards prevent unauthorized UI interactions
 * 2. API Layer: This middleware validates permissions before database operations
 * 3. Database RLS: Final enforcement layer at the database level
 *
 * Usage in API routes:
 * ```ts
 * import { validatePhasePermission } from '@/lib/middleware/permission-middleware'
 *
 * export async function PATCH(req: Request) {
 *   const user = await validatePhasePermission({
 *     workspaceId: 'workspace_123',
 *     teamId: 'team_456',
 *     phase: 'execution',
 *     action: 'edit',
 *   })
 *
 *   // If we get here, user has permission
 *   // Proceed with database operation
 * }
 * ```
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { WorkspacePhase } from '@/lib/constants/workspace-phases'
import { canUserEditPhase, isUserAdminOrOwner } from '@/lib/utils/phase-permissions'

/**
 * Permission validation error
 *
 * Thrown when user lacks required permissions.
 * Includes details for debugging and audit logging.
 */
export class PermissionDeniedError extends Error {
  constructor(
    public userId: string,
    public action: string,
    public phase: WorkspacePhase,
    public reason: string
  ) {
    super(`Permission denied: User ${userId} cannot ${action} in phase ${phase}. Reason: ${reason}`)
    this.name = 'PermissionDeniedError'
  }
}

/**
 * Authentication error
 *
 * Thrown when user is not authenticated.
 */
export class UnauthenticatedError extends Error {
  constructor() {
    super('Authentication required. Please log in to continue.')
    this.name = 'UnauthenticatedError'
  }
}

/**
 * Permission check result
 */
interface PermissionCheckResult {
  /** Whether permission is granted */
  granted: boolean

  /** User ID (if authenticated) */
  userId?: string

  /** Reason for denial (if denied) */
  reason?: string

  /** Whether user is admin/owner (bypasses phase restrictions) */
  isAdmin?: boolean
}

/**
 * Validate phase permission for API request
 *
 * Checks if authenticated user has required permission for the phase.
 * Throws error if permission denied or user not authenticated.
 *
 * @param params - Permission check parameters
 * @returns Authenticated user object
 * @throws {UnauthenticatedError} If user not logged in
 * @throws {PermissionDeniedError} If user lacks required permission
 *
 * @example
 * ```ts
 * // In API route handler
 * export async function PATCH(req: Request, { params }: { params: { id: string } }) {
 *   const user = await validatePhasePermission({
 *     workspaceId: params.workspaceId,
 *     teamId: params.teamId,
 *     phase: 'execution',
 *     action: 'edit',
 *   })
 *
 *   // User is authenticated and has permission
 *   // Proceed with database update
 * }
 * ```
 */
export async function validatePhasePermission({
  workspaceId,
  teamId,
  phase,
  action,
}: {
  workspaceId: string
  teamId: string
  phase: WorkspacePhase
  action: 'view' | 'edit' | 'delete'
}): Promise<{ id: string; email?: string }> {
  const supabase = await createClient()

  // 1. Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new UnauthenticatedError()
  }

  // 2. Check permission
  const result = await checkPhasePermission({
    userId: user.id,
    workspaceId,
    teamId,
    phase,
    action,
  })

  if (!result.granted) {
    throw new PermissionDeniedError(user.id, action, phase, result.reason ?? 'Unknown reason')
  }

  return user
}

/**
 * Check phase permission without throwing errors
 *
 * Use this when you need to check permission without failing the request.
 * Returns result object instead of throwing.
 *
 * @param params - Permission check parameters
 * @returns Permission check result
 *
 * @example
 * ```ts
 * const result = await checkPhasePermission({
 *   userId: user.id,
 *   workspaceId: 'workspace_123',
 *   teamId: 'team_456',
 *   phase: 'execution',
 *   action: 'edit',
 * })
 *
 * if (result.granted) {
 *   // Proceed
 * } else {
 *   // Handle denial gracefully
 *   console.log(result.reason)
 * }
 * ```
 */
export async function checkPhasePermission({
  userId,
  workspaceId,
  teamId,
  phase,
  action,
}: {
  userId: string
  workspaceId: string
  teamId: string
  phase: WorkspacePhase
  action: 'view' | 'edit' | 'delete'
}): Promise<PermissionCheckResult> {
  try {
    // Check if user is admin/owner (bypasses phase restrictions)
    const isAdmin = await isUserAdminOrOwner(userId, teamId)

    if (isAdmin) {
      return {
        granted: true,
        userId,
        isAdmin: true,
      }
    }

    // For view action, all team members have access
    if (action === 'view') {
      return {
        granted: true,
        userId,
        isAdmin: false,
      }
    }

    // For edit/delete, check phase assignment
    const canEdit = await canUserEditPhase(userId, workspaceId, teamId, phase)

    if (!canEdit) {
      return {
        granted: false,
        userId,
        isAdmin: false,
        reason: `User not assigned to edit ${phase} phase. Contact team admin to request access.`,
      }
    }

    return {
      granted: true,
      userId,
      isAdmin: false,
    }
  } catch (error) {
    console.error('Error checking phase permission:', error)
    return {
      granted: false,
      userId,
      reason: 'Internal error checking permissions',
    }
  }
}

/**
 * Handle permission errors in API routes
 *
 * Converts permission errors into appropriate HTTP responses.
 * Use this in API route catch blocks.
 *
 * @param error - Error to handle
 * @returns NextResponse with appropriate status code
 *
 * @example
 * ```ts
 * export async function PATCH(req: Request) {
 *   try {
 *     await validatePhasePermission({ ... })
 *     // ... handle request
 *   } catch (error) {
 *     return handlePermissionError(error)
 *   }
 * }
 * ```
 */
export function handlePermissionError(error: unknown): NextResponse {
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json(
      {
        error: 'Authentication required',
        message: error.message,
        code: 'UNAUTHENTICATED',
      },
      { status: 401 }
    )
  }

  if (error instanceof PermissionDeniedError) {
    return NextResponse.json(
      {
        error: 'Permission denied',
        message: error.message,
        details: {
          userId: error.userId,
          action: error.action,
          phase: error.phase,
          reason: error.reason,
        },
        code: 'PERMISSION_DENIED',
      },
      { status: 403 }
    )
  }

  // Unknown error
  console.error('Unexpected error in permission check:', error)
  return NextResponse.json(
    {
      error: 'Internal server error',
      message: 'An unexpected error occurred while checking permissions',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  )
}

/**
 * Validate admin-only permission
 *
 * Simpler check for operations that require admin/owner role.
 * Bypasses phase-based restrictions entirely.
 *
 * @param teamId - Team ID to check
 * @returns Authenticated admin user
 * @throws {UnauthenticatedError} If user not logged in
 * @throws {PermissionDeniedError} If user is not admin/owner
 *
 * @example
 * ```ts
 * export async function DELETE(req: Request, { params }: { params: { id: string } }) {
 *   const user = await validateAdminPermission(params.teamId)
 *
 *   // User is admin/owner, proceed with workspace deletion
 * }
 * ```
 */
export async function validateAdminPermission(
  teamId: string
): Promise<{ id: string; email?: string }> {
  const supabase = await createClient()

  // 1. Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new UnauthenticatedError()
  }

  // 2. Check admin status
  const isAdmin = await isUserAdminOrOwner(user.id, teamId)

  if (!isAdmin) {
    throw new PermissionDeniedError(
      user.id,
      'admin action',
      'complete', // Dummy phase for admin actions
      'This action requires admin or owner privileges'
    )
  }

  return user
}

/**
 * Audit log entry for permission checks
 *
 * Log permission denials for security monitoring.
 * In production, send to logging service (e.g., DataDog, Sentry).
 */
export function logPermissionDenial({
  userId,
  action,
  phase,
  workspaceId,
  teamId,
  reason,
  ipAddress,
  userAgent,
}: {
  userId: string
  action: string
  phase: WorkspacePhase
  workspaceId: string
  teamId: string
  reason: string
  ipAddress?: string
  userAgent?: string
}) {
  // Console log for development
  console.warn('🚨 Permission Denial:', {
    timestamp: new Date().toISOString(),
    userId,
    action,
    phase,
    workspaceId,
    teamId,
    reason,
    ipAddress,
    userAgent,
  })

  // TODO: In production, send to logging service
  // Example: Sentry, DataDog, CloudWatch, etc.
  // await sendToLoggingService({ ... })
}
