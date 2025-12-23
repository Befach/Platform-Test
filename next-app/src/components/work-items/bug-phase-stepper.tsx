'use client'

import { cn } from '@/lib/utils'
import { Check, ChevronRight } from 'lucide-react'
import {
  BUG_PHASES,
  BUG_PHASE_CONFIG,
  type BugPhase,
  getPhaseIndex,
  canTransitionTo,
  getBugPhaseConfig,
} from '@/lib/bug/workflow'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

export interface BugPhaseStepperProps {
  currentPhase: BugPhase
  onPhaseClick?: (phase: BugPhase) => void
  reviewEnabled?: boolean
  reviewStatus?: string | null
  disabled?: boolean
  className?: string
  compact?: boolean
}

export function BugPhaseStepper({
  currentPhase,
  onPhaseClick,
  reviewEnabled,
  reviewStatus,
  disabled = false,
  className,
  compact = false,
}: BugPhaseStepperProps) {
  const currentIndex = getPhaseIndex(currentPhase)

  const handlePhaseClick = (phase: BugPhase) => {
    if (disabled || !onPhaseClick) return
    // Only allow clicking if it's a valid transition
    if (canTransitionTo(currentPhase, phase)) {
      onPhaseClick(phase)
    }
  }

  return (
    <TooltipProvider>
      <div className={cn('flex items-center justify-between', className)}>
        {BUG_PHASES.map((phase, index) => {
          const config = BUG_PHASE_CONFIG[phase]
          const isCompleted = index < currentIndex
          const isCurrent = phase === currentPhase
          const isFuture = index > currentIndex
          const canClick = !disabled && onPhaseClick && canTransitionTo(currentPhase, phase)

          // Show review indicator on fixing phase
          const showReviewIndicator = phase === 'fixing' && reviewEnabled

          return (
            <div key={phase} className="flex items-center flex-1 last:flex-none">
              {/* Phase Circle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handlePhaseClick(phase)}
                    disabled={!canClick}
                    className={cn(
                      'relative flex flex-col items-center gap-1 transition-all',
                      canClick && 'cursor-pointer hover:opacity-80',
                      !canClick && 'cursor-default'
                    )}
                  >
                    {/* Circle */}
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-full border-2 transition-all',
                        compact ? 'h-8 w-8' : 'h-10 w-10',
                        isCompleted && [
                          'border-green-500 bg-green-500 text-white',
                        ],
                        isCurrent && [
                          'border-current bg-current',
                        ],
                        isFuture && [
                          'border-gray-300 bg-white text-gray-400',
                          'dark:border-gray-600 dark:bg-gray-800',
                        ]
                      )}
                      style={isCurrent ? {
                        borderColor: config.color,
                        backgroundColor: config.color,
                        color: 'white',
                      } : undefined}
                    >
                      {isCompleted ? (
                        <Check className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
                      ) : (
                        <span className={cn(compact ? 'text-xs' : 'text-sm', 'font-medium')}>
                          {config.emoji}
                        </span>
                      )}
                    </div>

                    {/* Phase Name */}
                    {!compact && (
                      <span
                        className={cn(
                          'text-xs font-medium whitespace-nowrap',
                          isCompleted && 'text-green-600 dark:text-green-400',
                          isCurrent && 'font-semibold',
                          isFuture && 'text-gray-400 dark:text-gray-500'
                        )}
                        style={isCurrent ? { color: config.color } : undefined}
                      >
                        {config.name}
                      </span>
                    )}

                    {/* Review Indicator */}
                    {showReviewIndicator && (
                      <div className="absolute -top-1 -right-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            'h-4 px-1 text-[10px] font-normal',
                            reviewStatus === 'approved' && 'border-green-500 bg-green-50 text-green-700',
                            reviewStatus === 'pending' && 'border-amber-500 bg-amber-50 text-amber-700',
                            reviewStatus === 'rejected' && 'border-red-500 bg-red-50 text-red-700',
                            !reviewStatus && 'border-purple-500 bg-purple-50 text-purple-700'
                          )}
                        >
                          {reviewStatus === 'approved' ? '✓' : reviewStatus === 'pending' ? '⏳' : reviewStatus === 'rejected' ? '✗' : 'R'}
                        </Badge>
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <div className="space-y-1">
                    <p className="font-medium">{config.name}</p>
                    <p className="text-xs text-muted-foreground">{config.tagline}</p>
                    {canClick && (
                      <p className="text-xs text-primary">Click to transition</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Connector Line */}
              {index < BUG_PHASES.length - 1 && (
                <div className="flex-1 mx-2">
                  <div
                    className={cn(
                      'h-0.5 w-full transition-colors',
                      index < currentIndex
                        ? 'bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

/**
 * Compact inline version for headers/cards
 */
export function BugPhaseStepperInline({
  currentPhase,
  className,
}: {
  currentPhase: BugPhase
  className?: string
}) {
  const config = getBugPhaseConfig(currentPhase)
  const currentIndex = getPhaseIndex(currentPhase)

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {BUG_PHASES.map((phase, index) => {
        const phaseConfig = getBugPhaseConfig(phase)
        const isCompleted = index < currentIndex
        const isCurrent = phase === currentPhase

        return (
          <TooltipProvider key={phase}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'h-2 w-2 rounded-full transition-all',
                    isCompleted && 'bg-green-500',
                    isCurrent && 'ring-2 ring-offset-1',
                    !isCompleted && !isCurrent && 'bg-gray-200 dark:bg-gray-700'
                  )}
                  style={isCurrent ? {
                    backgroundColor: phaseConfig.color,
                    ['--tw-ring-color' as string]: phaseConfig.color,
                  } : undefined}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{phaseConfig.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
      <span
        className="ml-1 text-xs font-medium"
        style={{ color: config.color }}
      >
        {config.name}
      </span>
    </div>
  )
}
