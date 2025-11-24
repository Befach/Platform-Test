'use client'

import { Badge } from '@/components/ui/badge'
import { WorkspacePhase } from '@/lib/constants/work-item-types'
import { usePhaseAwareFields } from '@/hooks/use-phase-aware-fields'
import { cn } from '@/lib/utils'

interface PhaseContextBadgeProps {
  phase: WorkspacePhase
  showFieldCount?: boolean
  className?: string
}

/**
 * Display badge showing the current workspace phase with appropriate styling
 *
 * Features:
 * - Phase-specific colors matching workspace design system
 * - Optional field count display
 * - Consistent with research-backed color palette
 *
 * @example
 * ```tsx
 * <PhaseContextBadge phase="planning" />
 * <PhaseContextBadge phase="execution" showFieldCount={false} />
 * ```
 */
export function PhaseContextBadge({
  phase,
  showFieldCount = true,
  className
}: PhaseContextBadgeProps) {
  const { visibleFields } = usePhaseAwareFields(phase)

  // Phase configurations matching workspace color system
  // Using Indigo → Violet → Emerald → Amber → Green progression
  const phaseConfig: Record<WorkspacePhase, {
    label: string
    className: string
    description: string
  }> = {
    research: {
      label: 'Research',
      className: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
      description: 'Exploring and validating ideas',
    },
    planning: {
      label: 'Planning',
      className: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
      description: 'Defining requirements and approach',
    },
    execution: {
      label: 'Execution',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
      description: 'Building and implementing',
    },
    review: {
      label: 'Review',
      className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      description: 'Gathering feedback and testing',
    },
    complete: {
      label: 'Complete',
      className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      description: 'Finished and released',
    },
  }

  const config = phaseConfig[phase]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge
        className={cn(
          'font-medium',
          config.className
        )}
        title={config.description}
      >
        {config.label}
      </Badge>
      {showFieldCount && (
        <span className="text-xs text-muted-foreground">
          {visibleFields.length} field{visibleFields.length !== 1 ? 's' : ''} available
        </span>
      )}
    </div>
  )
}
