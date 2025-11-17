/**
 * Permission Badge Components
 *
 * Visual indicators showing user's permission level for phases.
 * Provides clear feedback about what actions are allowed.
 *
 * Features:
 * - Color-coded badges (green = edit, amber = view, red = no access)
 * - Icon indicators (unlock, eye, lock)
 * - Tooltips with detailed explanations
 * - Responsive design
 *
 * Usage:
 * ```tsx
 * <PhasePermissionBadge
 *   phase="execution"
 *   workspaceId={id}
 *   teamId={teamId}
 *   showTooltip
 * />
 * ```
 */

'use client'

import { usePhasePermissions } from '@/hooks/use-phase-permissions'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { getPhasePermissionBadge } from '@/lib/utils/phase-permissions'
import { PHASE_CONFIG, type WorkspacePhase } from '@/lib/constants/workspace-phases'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Lock, Unlock, Eye, Crown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhasePermissionBadgeProps {
  /** Phase to show permission for */
  phase: WorkspacePhase

  /** Workspace ID */
  workspaceId: string

  /** Team ID */
  teamId: string

  /** Show tooltip with detailed explanation */
  showTooltip?: boolean

  /** Custom tooltip message */
  tooltipMessage?: string

  /** Compact size */
  size?: 'sm' | 'md' | 'lg'

  /** Custom class name */
  className?: string
}

/**
 * Badge showing user's permission level for a specific phase
 *
 * @example
 * ```tsx
 * // Show permission badge with tooltip
 * <PhasePermissionBadge
 *   phase="execution"
 *   workspaceId={workspaceId}
 *   teamId={teamId}
 *   showTooltip
 * />
 *
 * // Compact badge without tooltip
 * <PhasePermissionBadge
 *   phase="planning"
 *   workspaceId={workspaceId}
 *   teamId={teamId}
 *   size="sm"
 * />
 * ```
 */
export function PhasePermissionBadge({
  phase,
  workspaceId,
  teamId,
  showTooltip = true,
  tooltipMessage,
  size = 'md',
  className,
}: PhasePermissionBadgeProps) {
  const { permissions, isLoading } = usePhasePermissions({ workspaceId, teamId })
  const { isAdmin } = useIsAdmin({ teamId })

  if (isLoading) {
    return (
      <Badge variant="outline" className={cn('gap-1', className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Loading...</span>
      </Badge>
    )
  }

  if (!permissions) {
    return null
  }

  const permission = permissions[phase]
  const badgeConfig = getPhasePermissionBadge(phase, permission)
  const phaseConfig = PHASE_CONFIG[phase]

  // Determine icon
  let Icon = Lock
  if (isAdmin) {
    Icon = Crown
  } else if (badgeConfig.icon === 'unlock') {
    Icon = Unlock
  } else if (badgeConfig.icon === 'eye') {
    Icon = Eye
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }

  // Build tooltip message
  const defaultTooltipMessage = isAdmin
    ? `Admin access: You can view, edit, and delete all items in all phases.`
    : permission.can_edit
    ? `You can view, edit, and delete items in the ${phaseConfig.name} phase.`
    : permission.can_view
    ? `You can view items in the ${phaseConfig.name} phase, but cannot edit or delete them. Contact your team admin to request edit access.`
    : `You don't have access to the ${phaseConfig.name} phase.`

  const tooltipText = tooltipMessage ?? defaultTooltipMessage

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium border',
        isAdmin ? 'text-purple-600 bg-purple-50 border-purple-200' : badgeConfig.color,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>{isAdmin ? 'Admin' : badgeConfig.label}</span>
    </Badge>
  )

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}

/**
 * Display all phase permissions in a grid
 *
 * Shows permission status for all 5 phases at once.
 * Useful for settings pages or permission overviews.
 *
 * @example
 * ```tsx
 * <AllPhasesPermissionGrid
 *   workspaceId={workspaceId}
 *   teamId={teamId}
 * />
 * ```
 */
export function AllPhasesPermissionGrid({
  workspaceId,
  teamId,
  className,
}: {
  workspaceId: string
  teamId: string
  className?: string
}) {
  const { permissions, isLoading } = usePhasePermissions({ workspaceId, teamId })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!permissions) {
    return null
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3', className)}>
      {(Object.keys(PHASE_CONFIG) as WorkspacePhase[]).map((phase) => {
        const phaseConfig = PHASE_CONFIG[phase]
        const permission = permissions[phase]

        return (
          <div
            key={phase}
            className="flex items-center justify-between p-4 border rounded-lg bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{phaseConfig.icon}</div>
              <div>
                <h4 className="font-medium">{phaseConfig.name}</h4>
                <p className="text-xs text-muted-foreground">{phaseConfig.description}</p>
              </div>
            </div>
            <PhasePermissionBadge
              phase={phase}
              workspaceId={workspaceId}
              teamId={teamId}
              size="sm"
            />
          </div>
        )
      })}
    </div>
  )
}

/**
 * Inline permission indicator with icon only
 *
 * Minimal indicator for tight spaces (tables, lists).
 *
 * @example
 * ```tsx
 * <PermissionIcon
 *   phase="execution"
 *   workspaceId={workspaceId}
 *   teamId={teamId}
 *   showTooltip
 * />
 * ```
 */
export function PermissionIcon({
  phase,
  workspaceId,
  teamId,
  showTooltip = true,
  size = 'md',
  className,
}: {
  phase: WorkspacePhase
  workspaceId: string
  teamId: string
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const { permissions, isLoading } = usePhasePermissions({ workspaceId, teamId })
  const { isAdmin } = useIsAdmin({ teamId })

  if (isLoading) {
    return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
  }

  if (!permissions) {
    return null
  }

  const permission = permissions[phase]
  const badgeConfig = getPhasePermissionBadge(phase, permission)
  const phaseConfig = PHASE_CONFIG[phase]

  let Icon = Lock
  let colorClass = 'text-red-600'

  if (isAdmin) {
    Icon = Crown
    colorClass = 'text-purple-600'
  } else if (badgeConfig.icon === 'unlock') {
    Icon = Unlock
    colorClass = 'text-green-600'
  } else if (badgeConfig.icon === 'eye') {
    Icon = Eye
    colorClass = 'text-amber-600'
  }

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const tooltipMessage = isAdmin
    ? 'Admin access'
    : permission.can_edit
    ? `Can edit ${phaseConfig.name}`
    : permission.can_view
    ? `View only`
    : 'No access'

  const icon = <Icon className={cn(sizeClasses[size], colorClass, className)} />

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{icon}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return icon
}

/**
 * Permission summary text
 *
 * Human-readable summary of user's phase access.
 *
 * @example
 * ```tsx
 * <PermissionSummary
 *   workspaceId={workspaceId}
 *   teamId={teamId}
 * />
 * // Output: "You can edit 3 phases (Research, Planning, Execution)"
 * ```
 */
export function PermissionSummary({
  workspaceId,
  teamId,
  className,
}: {
  workspaceId: string
  teamId: string
  className?: string
}) {
  const { permissions, isLoading } = usePhasePermissions({ workspaceId, teamId })
  const { isAdmin } = useIsAdmin({ teamId })

  if (isLoading) {
    return <div className={cn('text-sm text-muted-foreground', className)}>Loading permissions...</div>
  }

  if (!permissions) {
    return null
  }

  if (isAdmin) {
    return (
      <div className={cn('text-sm flex items-center gap-2', className)}>
        <Crown className="h-4 w-4 text-purple-600" />
        <span className="font-medium text-purple-600">
          Admin Access - Full control of all phases
        </span>
      </div>
    )
  }

  const editablePhases = (Object.keys(permissions) as WorkspacePhase[]).filter(
    (phase) => permissions[phase].can_edit
  )

  const editablePhaseNames = editablePhases.map((phase) => PHASE_CONFIG[phase].name).join(', ')

  const count = editablePhases.length
  const total = Object.keys(PHASE_CONFIG).length

  if (count === 0) {
    return (
      <div className={cn('text-sm text-amber-600', className)}>
        You have view-only access to all phases
      </div>
    )
  }

  if (count === total) {
    return (
      <div className={cn('text-sm text-green-600', className)}>
        You can edit all {total} phases
      </div>
    )
  }

  return (
    <div className={cn('text-sm', className)}>
      You can edit {count} of {total} phases:{' '}
      <span className="font-medium">{editablePhaseNames}</span>
    </div>
  )
}
