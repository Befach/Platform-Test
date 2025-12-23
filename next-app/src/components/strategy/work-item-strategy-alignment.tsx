'use client'

/**
 * WorkItemStrategyAlignment Component
 *
 * Compact view for work item detail showing:
 * - Primary strategy alignment (if set)
 * - Additional aligned strategies (from junction table)
 * - Alignment strength indicator for each
 * - Quick-link to full strategy view
 * - "Add alignment" button
 *
 * This is the WORK-ITEM-LEVEL view (compact, actionable)
 * as opposed to the organization-level view (full tree + context)
 */

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Flag,
  Target,
  TrendingUp,
  Lightbulb,
  Plus,
  ExternalLink,
  X,
  Star,
  Link2,
} from 'lucide-react'
import { AlignmentStrengthIndicator } from './alignment-strength-indicator'
import {
  getStrategyTypeLabel,
  getStrategyTypeShortLabel,
  STRATEGY_TYPE_COLORS,
  getDisplayProgress,
} from '@/lib/types/strategy'
import type {
  ProductStrategy,
  WorkItemStrategyWithDetails,
  StrategyType,
} from '@/lib/types/strategy'

interface WorkItemStrategyAlignmentProps {
  workItemId: string
  primaryStrategy: ProductStrategy | null
  additionalAlignments: WorkItemStrategyWithDetails[]
  onAddAlignment?: () => void
  onRemoveAlignment?: (alignmentId: string) => void
  onRemovePrimary?: () => void
  onViewStrategy?: (strategyId: string) => void
  readonly?: boolean
  className?: string
}

export function WorkItemStrategyAlignment({
  workItemId,
  primaryStrategy,
  additionalAlignments,
  onAddAlignment,
  onRemoveAlignment,
  onRemovePrimary,
  onViewStrategy,
  readonly = false,
  className,
}: WorkItemStrategyAlignmentProps) {
  const hasAnyAlignment = primaryStrategy || additionalAlignments.length > 0
  const totalAlignments = (primaryStrategy ? 1 : 0) + additionalAlignments.length

  // Type icon mapping
  const TypeIcon = (type: StrategyType) => {
    const icons = {
      pillar: Flag,
      objective: Target,
      key_result: TrendingUp,
      initiative: Lightbulb,
    }
    return icons[type]
  }

  if (!hasAnyAlignment && readonly) {
    return (
      <div className={cn('text-sm text-muted-foreground py-2', className)}>
        No strategy alignment
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with count and add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Strategy Alignment</span>
          {totalAlignments > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalAlignments}
            </Badge>
          )}
        </div>
        {!readonly && onAddAlignment && (
          <Button variant="outline" size="sm" onClick={onAddAlignment}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* No alignments message */}
      {!hasAnyAlignment && !readonly && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No strategies aligned to this work item
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;Add&quot; to align with organizational strategies
            </p>
          </CardContent>
        </Card>
      )}

      {/* Primary strategy alignment */}
      {primaryStrategy && (
        <StrategyAlignmentCard
          strategy={primaryStrategy}
          isPrimary
          onView={onViewStrategy}
          onRemove={!readonly ? onRemovePrimary : undefined}
          TypeIcon={TypeIcon}
        />
      )}

      {/* Additional alignments */}
      {additionalAlignments.length > 0 && (
        <div className="space-y-2">
          {primaryStrategy && additionalAlignments.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">Additional Alignments</p>
          )}
          {additionalAlignments.map((alignment) => (
            <StrategyAlignmentCard
              key={alignment.id}
              strategy={alignment.strategy}
              alignmentId={alignment.id}
              alignmentStrength={alignment.alignment_strength}
              notes={alignment.notes}
              onView={onViewStrategy}
              onRemove={!readonly ? () => onRemoveAlignment?.(alignment.id) : undefined}
              TypeIcon={TypeIcon}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Individual strategy alignment card
 */
interface StrategyAlignmentCardProps {
  strategy: ProductStrategy
  isPrimary?: boolean
  alignmentId?: string
  alignmentStrength?: 'weak' | 'medium' | 'strong'
  notes?: string | null
  onView?: (strategyId: string) => void
  onRemove?: () => void
  TypeIcon: (type: StrategyType) => React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

function StrategyAlignmentCard({
  strategy,
  isPrimary = false,
  alignmentStrength,
  notes,
  onView,
  onRemove,
  TypeIcon,
}: StrategyAlignmentCardProps) {
  const Icon = TypeIcon(strategy.type)
  const progress = getDisplayProgress(strategy)

  return (
    <Card
      className={cn(
        'group transition-all',
        isPrimary && 'ring-1 ring-primary/30 bg-primary/5'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Type indicator */}
          <div
            className="p-1.5 rounded shrink-0"
            style={{ backgroundColor: `${STRATEGY_TYPE_COLORS[strategy.type]}20` }}
          >
            <Icon
              className="h-4 w-4"
              style={{ color: STRATEGY_TYPE_COLORS[strategy.type] }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* Title */}
              <h4 className="text-sm font-medium truncate flex-1">{strategy.title}</h4>

              {/* Primary badge */}
              {isPrimary && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant="default"
                        className="text-xs shrink-0 gap-1 bg-primary/80"
                      >
                        <Star className="h-3 w-3" />
                        Primary
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Primary strategy alignment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Alignment strength (for additional alignments) */}
              {!isPrimary && alignmentStrength && (
                <AlignmentStrengthIndicator
                  strength={alignmentStrength}
                  variant="badge"
                  size="sm"
                />
              )}
            </div>

            {/* Type + Progress row */}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span>{getStrategyTypeLabel(strategy.type)}</span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      progress >= 70
                        ? 'bg-green-500'
                        : progress >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span>{progress}%</span>
              </div>
            </div>

            {/* Notes (if any) */}
            {notes && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 italic">
                &quot;{notes}&quot;
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {onView && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onView(strategy.id)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View strategy</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {onRemove && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={onRemove}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove alignment</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Inline version for compact spaces (e.g., table cells, list items)
 */
interface WorkItemStrategyAlignmentInlineProps {
  primaryStrategy: ProductStrategy | null
  additionalCount?: number
  onView?: (strategyId: string) => void
  className?: string
}

export function WorkItemStrategyAlignmentInline({
  primaryStrategy,
  additionalCount = 0,
  onView,
  className,
}: WorkItemStrategyAlignmentInlineProps) {
  if (!primaryStrategy) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        No alignment
      </span>
    )
  }

  const Icon = {
    pillar: Flag,
    objective: Target,
    key_result: TrendingUp,
    initiative: Lightbulb,
  }[primaryStrategy.type]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onView?.(primaryStrategy.id)}
            className={cn(
              'flex items-center gap-1.5 text-xs hover:underline',
              className
            )}
          >
            <Icon
              className="h-3.5 w-3.5"
              style={{ color: STRATEGY_TYPE_COLORS[primaryStrategy.type] }}
            />
            <span className="truncate max-w-[120px]">{primaryStrategy.title}</span>
            {additionalCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1">
                +{additionalCount}
              </Badge>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-medium">{primaryStrategy.title}</p>
          <p className="text-xs text-muted-foreground">
            {getStrategyTypeLabel(primaryStrategy.type)}
            {additionalCount > 0 && ` + ${additionalCount} more`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
