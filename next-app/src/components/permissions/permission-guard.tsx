/**
 * Permission Guard Components
 *
 * Wrapper components that enforce phase-based permissions on UI elements.
 * Provides multiple security layers:
 * - Hide elements user cannot access
 * - Disable elements user cannot edit
 * - Show permission-denied messages
 * - Prevent unauthorized interactions
 *
 * Usage:
 * ```tsx
 * <PhaseEditGuard phase="execution" workspaceId={id} teamId={teamId}>
 *   <Button>Edit Item</Button>
 * </PhaseEditGuard>
 * ```
 */

'use client'

import { ReactNode } from 'react'
import { usePhasePermissions } from '@/hooks/use-phase-permissions'
import { useIsAdmin } from '@/hooks/use-is-admin'
import type { WorkspacePhase } from '@/lib/types/team'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Lock, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface PermissionGuardBaseProps {
  /** Workspace ID */
  workspaceId: string

  /** Team ID */
  teamId: string

  /** Phase to check permissions for */
  phase: WorkspacePhase

  /** Content to render if permission granted */
  children: ReactNode

  /** Show loading state while checking permissions */
  showLoading?: boolean

  /** Custom loading component */
  loadingComponent?: ReactNode
}

interface PhaseEditGuardProps extends PermissionGuardBaseProps {
  /** What to render when permission denied */
  fallback?: 'hide' | 'disable' | 'message' | ReactNode

  /** Custom permission denied message */
  deniedMessage?: string

  /** Show tooltip with permission explanation */
  showTooltip?: boolean

  /** Tooltip message */
  tooltipMessage?: string
}

/**
 * Guard that enforces edit permissions on phase content
 *
 * Modes:
 * - `hide`: Don't render children if no permission (default)
 * - `disable`: Render children but disable them
 * - `message`: Show permission denied message
 * - Custom ReactNode: Render custom fallback
 *
 * @example
 * ```tsx
 * // Hide edit button if no permission
 * <PhaseEditGuard phase="execution" workspaceId={id} teamId={teamId}>
 *   <Button>Edit</Button>
 * </PhaseEditGuard>
 *
 * // Show disabled button with tooltip
 * <PhaseEditGuard
 *   phase="execution"
 *   workspaceId={id}
 *   teamId={teamId}
 *   fallback="disable"
 *   showTooltip
 * >
 *   <Button>Edit</Button>
 * </PhaseEditGuard>
 * ```
 */
export function PhaseEditGuard({
  workspaceId,
  teamId,
  phase,
  children,
  fallback = 'hide',
  deniedMessage,
  showTooltip = false,
  tooltipMessage,
  showLoading = true,
  loadingComponent,
}: PhaseEditGuardProps) {
  const { canEdit, isLoading } = usePhasePermissions({ workspaceId, teamId })

  // Show loading state
  if (isLoading && showLoading) {
    return loadingComponent ?? (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking permissions...</span>
      </div>
    )
  }

  // Check permission
  const hasPermission = canEdit(phase)

  // Permission granted - render children
  if (hasPermission) {
    return <>{children}</>
  }

  // Permission denied - handle fallback
  const defaultMessage = `You don't have permission to edit items in the ${phase} phase. Contact your team admin to request access.`
  const message = deniedMessage ?? defaultMessage

  // Hide mode - render nothing
  if (fallback === 'hide') {
    return null
  }

  // Disable mode - render children with disabled state and optional tooltip
  if (fallback === 'disable') {
    const disabledChildren = <div className="pointer-events-none opacity-50">{children}</div>

    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{disabledChildren}</TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltipMessage ?? message}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return disabledChildren
  }

  // Message mode - show permission denied alert
  if (fallback === 'message') {
    return (
      <Alert variant="destructive">
        <Lock className="h-4 w-4" />
        <AlertTitle>Permission Denied</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    )
  }

  // Custom fallback - render provided component
  return <>{fallback}</>
}

/**
 * Guard that only allows admins and owners
 *
 * Simpler guard for admin-only features that bypass phase restrictions.
 *
 * @example
 * ```tsx
 * <AdminOnlyGuard teamId={teamId} fallback="message">
 *   <Button>Delete Workspace</Button>
 * </AdminOnlyGuard>
 * ```
 */
export function AdminOnlyGuard({
  teamId,
  children,
  fallback = 'hide',
  deniedMessage,
  showLoading = true,
  loadingComponent,
}: {
  teamId: string
  children: ReactNode
  fallback?: 'hide' | 'message' | ReactNode
  deniedMessage?: string
  showLoading?: boolean
  loadingComponent?: ReactNode
}) {
  const { isAdmin, isLoading } = useIsAdmin({ teamId })

  // Show loading state
  if (isLoading && showLoading) {
    return loadingComponent ?? (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking permissions...</span>
      </div>
    )
  }

  // Admin/owner - render children
  if (isAdmin) {
    return <>{children}</>
  }

  // Not admin - handle fallback
  const message = deniedMessage ?? 'This action requires admin or owner privileges.'

  if (fallback === 'hide') {
    return null
  }

  if (fallback === 'message') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Admin Only</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    )
  }

  return <>{fallback}</>
}

/**
 * Guard that enforces view permissions
 *
 * Usually all team members can view all phases, but this provides
 * explicit checking in case policies change.
 *
 * @example
 * ```tsx
 * <PhaseViewGuard phase="execution" workspaceId={id} teamId={teamId}>
 *   <WorkItemList />
 * </PhaseViewGuard>
 * ```
 */
export function PhaseViewGuard({
  workspaceId,
  teamId,
  phase,
  children,
  fallback = 'message',
  deniedMessage,
  showLoading = true,
  loadingComponent,
}: {
  workspaceId: string
  teamId: string
  phase: WorkspacePhase
  children: ReactNode
  fallback?: 'hide' | 'message' | ReactNode
  deniedMessage?: string
  showLoading?: boolean
  loadingComponent?: ReactNode
}) {
  const { canView, isLoading } = usePhasePermissions({ workspaceId, teamId })

  if (isLoading && showLoading) {
    return loadingComponent ?? (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  const hasPermission = canView(phase)

  if (hasPermission) {
    return <>{children}</>
  }

  const message = deniedMessage ?? `You don't have permission to view items in the ${phase} phase.`

  if (fallback === 'hide') {
    return null
  }

  if (fallback === 'message') {
    return (
      <Alert variant="destructive">
        <Lock className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    )
  }

  return <>{fallback}</>
}

/**
 * Conditional render based on permission check
 *
 * Flexible guard that renders different content based on permission state.
 *
 * @example
 * ```tsx
 * <PermissionSwitch
 *   workspaceId={id}
 *   teamId={teamId}
 *   phase="execution"
 *   when="edit"
 *   renderAllowed={<Button>Edit</Button>}
 *   renderDenied={<Button disabled>View Only</Button>}
 * />
 * ```
 */
export function PermissionSwitch({
  workspaceId,
  teamId,
  phase,
  when,
  renderAllowed,
  renderDenied,
  renderLoading,
}: {
  workspaceId: string
  teamId: string
  phase: WorkspacePhase
  when: 'view' | 'edit' | 'delete'
  renderAllowed: ReactNode
  renderDenied: ReactNode
  renderLoading?: ReactNode
}) {
  const { canView, canEdit, canDelete, isLoading } = usePhasePermissions({ workspaceId, teamId })

  if (isLoading) {
    return renderLoading ?? <Loader2 className="h-4 w-4 animate-spin" />
  }

  let hasPermission = false

  switch (when) {
    case 'view':
      hasPermission = canView(phase)
      break
    case 'edit':
      hasPermission = canEdit(phase)
      break
    case 'delete':
      hasPermission = canDelete(phase)
      break
  }

  return <>{hasPermission ? renderAllowed : renderDenied}</>
}
