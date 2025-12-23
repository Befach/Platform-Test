'use client'

/**
 * Type-Aware Phase Distribution Component
 *
 * Displays work item distribution grouped by type (feature, bug, concept, enhancement)
 * with type-appropriate phase colors and labels. Handles terminal phases like
 * validated/rejected for concepts and verified for bugs.
 */

import { useMemo } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  calculateTypeAwarePhaseDistribution,
  getTypePhaseConfig,
  TYPE_PHASE_MAP,
  TERMINAL_PHASES,
  type WorkItemType,
} from '@/lib/constants/workspace-phases'
import {
  ITEM_TYPE_METADATA,
} from '@/lib/constants/work-item-types'

// =============================================================================
// TYPES
// =============================================================================

export interface WorkItemForDistribution {
  type: string
  phase?: string
}

interface TypeDistributionBarProps {
  type: WorkItemType
  phases: Record<string, { count: number; percentage: number }>
  compact?: boolean
}

interface TypeAwarePhaseDistributionProps {
  workItems: WorkItemForDistribution[]
  className?: string
  compact?: boolean
  showEmptyTypes?: boolean
}

// =============================================================================
// TYPE DISTRIBUTION BAR
// =============================================================================

function TypeDistributionBar({ type, phases, compact = false }: TypeDistributionBarProps) {
  const typeInfo = ITEM_TYPE_METADATA[type]
  const validPhases = TYPE_PHASE_MAP[type] as readonly string[]
  const terminalPhases = TERMINAL_PHASES[type] || []

  // Calculate total items for this type
  const totalCount = Object.values(phases).reduce((sum, p) => sum + p.count, 0)

  if (totalCount === 0) return null

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', compact && 'gap-1')}>
        {/* Type icon */}
        <span
          className={cn(
            'flex-shrink-0',
            compact ? 'text-sm' : 'text-base'
          )}
          title={typeInfo?.singular || type}
        >
          {typeInfo?.icon || '📋'}
        </span>

        {/* Distribution bar */}
        <div
          className={cn(
            'flex-1 flex overflow-hidden rounded-full',
            compact ? 'h-2' : 'h-3'
          )}
        >
          {validPhases.map((phaseId) => {
            const phaseData = phases[phaseId]
            if (!phaseData || phaseData.count === 0) return null

            const config = getTypePhaseConfig(type, phaseId)
            const isTerminal = terminalPhases.includes(phaseId)

            return (
              <Tooltip key={phaseId}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'transition-all hover:opacity-80',
                      config?.bgColor || 'bg-gray-400',
                      isTerminal && 'relative'
                    )}
                    style={{ width: `${phaseData.percentage}%` }}
                  >
                    {/* Terminal phase indicator (small dot pattern) */}
                    {isTerminal && (
                      <div className="absolute inset-0 bg-white/20" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="flex items-center gap-1.5">
                    <span>{config?.emoji || '📋'}</span>
                    <span className="font-medium">{config?.name || phaseId}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {phaseData.count} {phaseData.count === 1 ? 'item' : 'items'} ({phaseData.percentage}%)
                  </div>
                  {isTerminal && (
                    <div className="text-muted-foreground italic">Terminal phase</div>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        {/* Count */}
        <span
          className={cn(
            'flex-shrink-0 text-muted-foreground',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {totalCount}
        </span>
      </div>
    </TooltipProvider>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TypeAwarePhaseDistribution({
  workItems,
  className,
  compact = false,
  showEmptyTypes = false,
}: TypeAwarePhaseDistributionProps) {
  // Calculate distribution using the type-aware function
  const distribution = useMemo(() => {
    return calculateTypeAwarePhaseDistribution(workItems)
  }, [workItems])

  // Get types that have items
  const typesWithItems = useMemo(() => {
    const types: WorkItemType[] = ['feature', 'concept', 'bug']
    return types.filter((type) => {
      const typeData = distribution[type]
      return Object.values(typeData).some((p) => p.count > 0)
    })
  }, [distribution])

  // If no items, show empty state
  if (workItems.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground italic', className)}>
        No work items
      </div>
    )
  }

  // Determine which types to show
  const typesToShow = showEmptyTypes
    ? (['feature', 'enhancement', 'concept', 'bug'] as WorkItemType[])
    : typesWithItems

  return (
    <div className={cn('space-y-2', compact && 'space-y-1', className)}>
      {typesToShow.map((type) => (
        <TypeDistributionBar
          key={type}
          type={type}
          phases={distribution[type]}
          compact={compact}
        />
      ))}
    </div>
  )
}

// =============================================================================
// UTILITY: COMPACT SUMMARY
// =============================================================================

interface DistributionSummaryProps {
  workItems: WorkItemForDistribution[]
  className?: string
}

/**
 * Compact text summary of work item distribution
 * Example: "5 features, 2 bugs, 1 concept"
 */
export function DistributionSummary({ workItems, className }: DistributionSummaryProps) {
  const summary = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of workItems) {
      counts[item.type] = (counts[item.type] || 0) + 1
    }

    const parts: string[] = []
    const order: WorkItemType[] = ['feature', 'bug', 'concept']

    for (const type of order) {
      const count = counts[type]
      if (count && count > 0) {
        const typeInfo = ITEM_TYPE_METADATA[type]
        const label = count === 1 ? typeInfo?.singular : typeInfo?.plural
        parts.push(`${count} ${label?.toLowerCase() || type}`)
      }
    }

    return parts.length > 0 ? parts.join(', ') : 'No items'
  }, [workItems])

  return <span className={className}>{summary}</span>
}

// =============================================================================
// UTILITY: PHASE LEGEND
// =============================================================================

interface PhaseLegendProps {
  type: WorkItemType
  className?: string
}

/**
 * Shows legend for phases of a specific type
 */
export function PhaseLegend({ type, className }: PhaseLegendProps) {
  const phases = TYPE_PHASE_MAP[type] as readonly string[]

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {phases.map((phaseId) => {
        const config = getTypePhaseConfig(type, phaseId)
        if (!config) return null

        return (
          <div key={phaseId} className="flex items-center gap-1">
            <div className={cn('h-2.5 w-2.5 rounded-full', config.bgColor)} />
            <span className="text-xs text-muted-foreground">{config.name}</span>
          </div>
        )
      })}
    </div>
  )
}
