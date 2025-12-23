'use client'

import { Badge } from '@/components/ui/badge'
import { WorkspacePhase, migrateLifecyclePhase } from '@/lib/constants/work-item-types'
import {
  PHASE_CONFIG,
  getTypePhaseConfig,
  isTerminalPhase,
  type WorkItemType
} from '@/lib/constants/workspace-phases'
import { usePhaseAwareFields } from '@/hooks/use-phase-aware-fields'
import { GuidingQuestionsTooltip } from './guiding-questions-tooltip'
import { cn } from '@/lib/utils'

interface PhaseContextBadgeProps {
  phase: WorkspacePhase | string
  /** Work item type for type-aware phase config */
  type?: WorkItemType
  showFieldCount?: boolean
  className?: string
  /** Show guiding questions tooltip on hover */
  showTooltip?: boolean
  /** Callback when user wants to open methodology panel */
  onOpenMethodologyPanel?: () => void
}

/**
 * Display badge showing the current workspace phase with appropriate styling
 *
 * Updated 2025-12-13: Migrated to 4-phase system
 * - design (was research/planning)
 * - build (was execution)
 * - refine (was review)
 * - launch (was complete)
 *
 * Features:
 * - Phase-specific colors matching workspace design system
 * - Optional field count display
 * - Supports both new and legacy phase values
 *
 * @example
 * ```tsx
 * <PhaseContextBadge phase="design" />
 * <PhaseContextBadge phase="build" showFieldCount={false} />
 * ```
 */
export function PhaseContextBadge({
  phase,
  type = 'feature',
  showFieldCount = true,
  className,
  showTooltip = false,
  onOpenMethodologyPanel,
}: PhaseContextBadgeProps) {
  // Migrate legacy phases to new phases (only for feature phases)
  // Note: Enhancement is now a flag on features, not a separate type
  const normalizedPhase = type === 'feature'
    ? migrateLifecyclePhase(phase)
    : (phase as string)

  // usePhaseAwareFields only works for feature phases
  const { visibleFields } = usePhaseAwareFields(
    type === 'feature' ? normalizedPhase as WorkspacePhase : 'design'
  )

  // Get type-aware phase config
  const phaseInfo = getTypePhaseConfig(type, normalizedPhase)

  // Don't render if no phase info (invalid phase for type)
  if (!phaseInfo) {
    return null
  }

  // Check if terminal phase (no field count for terminal phases)
  const isTerminal = isTerminalPhase(type, normalizedPhase)

  const badgeContent = (
    <Badge
      className={cn(
        'font-medium cursor-pointer',
        phaseInfo.bgColor,
        phaseInfo.textColor
      )}
      title={!showTooltip ? phaseInfo.description : undefined}
    >
      {phaseInfo.emoji} {phaseInfo.name}
    </Badge>
  )

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showTooltip ? (
        <GuidingQuestionsTooltip
          phase={normalizedPhase}
          type={type}
          onOpenPanel={onOpenMethodologyPanel}
        >
          {badgeContent}
        </GuidingQuestionsTooltip>
      ) : (
        badgeContent
      )}
      {showFieldCount && !isTerminal && (
        <span className="text-xs text-muted-foreground">
          {visibleFields.length} field{visibleFields.length !== 1 ? 's' : ''} available
        </span>
      )}
    </div>
  )
}
