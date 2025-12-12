'use client'

/**
 * TaskPlanCard Component
 *
 * Premium UI component for displaying and approving multi-step task plans.
 * Shows a visual breakdown of planned steps with approval controls.
 *
 * Features:
 * - Glassmorphism design with gradient accents
 * - Step-by-step visualization with status indicators
 * - Collapsible step details
 * - Premium micro-interactions
 * - Approval/Cancel/Step-by-Step modes
 */

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Play,
  ChevronDown,
  ChevronRight,
  ListChecks,
  Zap,
  AlertTriangle,
  Sparkles,
  Target,
} from 'lucide-react'
import type { TaskPlan, TaskStep } from '@/lib/ai/task-planner'

// =============================================================================
// TYPES
// =============================================================================

export interface TaskPlanCardProps {
  plan: TaskPlan
  onApproveAll: () => Promise<void>
  onStepByStep: () => void
  onEditPlan?: (plan: TaskPlan) => void
  onCancel: () => void
  isExecuting?: boolean
  className?: string
}

// =============================================================================
// PREMIUM STYLE CONSTANTS
// =============================================================================

const durationConfig = {
  fast: {
    icon: Zap,
    label: 'Quick',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  medium: {
    icon: Clock,
    label: 'Medium',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  slow: {
    icon: AlertTriangle,
    label: 'Takes time',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    label: 'Pending',
  },
  running: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Running',
    animate: true,
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    label: 'Done',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Failed',
  },
  skipped: {
    icon: ChevronRight,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    label: 'Skipped',
  },
}

// Tool category colors (matching tool-confirmation-card.tsx)
const toolCategoryColors: Record<string, string> = {
  createWorkItem: 'border-l-emerald-500',
  createTask: 'border-l-blue-500',
  createDependency: 'border-l-orange-500',
  createTimelineItem: 'border-l-purple-500',
  createInsight: 'border-l-amber-500',
  webSearch: 'border-l-cyan-500',
  extractData: 'border-l-violet-500',
  analyzeFeedback: 'border-l-rose-500',
}

// =============================================================================
// STEP ITEM COMPONENT
// =============================================================================

interface StepItemProps {
  step: TaskStep
  index: number
  isExpanded: boolean
  onToggle: () => void
}

function StepItem({ step, index, isExpanded, onToggle }: StepItemProps) {
  const status = statusConfig[step.status]
  const StatusIcon = status.icon
  const borderColor = toolCategoryColors[step.toolName] || 'border-l-zinc-500'

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div
        className={cn(
          'rounded-lg border border-white/10 transition-all duration-200',
          'hover:border-white/20 hover:bg-white/[0.02]',
          'border-l-2',
          borderColor
        )}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full p-3 flex items-center gap-3 text-left">
            {/* Step number */}
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                status.bgColor,
                status.color
              )}
            >
              {step.status === 'running' ? (
                <StatusIcon className="h-3.5 w-3.5 animate-spin" />
              ) : step.status === 'completed' ? (
                <StatusIcon className="h-3.5 w-3.5" />
              ) : step.status === 'failed' ? (
                <StatusIcon className="h-3.5 w-3.5" />
              ) : (
                index + 1
              )}
            </div>

            {/* Step info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {step.description}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 font-mono"
                >
                  {step.toolName}
                </Badge>
                {step.dependsOn.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    depends on step {step.dependsOn.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* Expand indicator */}
            <div className="text-muted-foreground">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0">
            <Separator className="mb-3" />
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Parameters:</div>
              <pre className="text-xs bg-black/20 p-2 rounded overflow-x-auto">
                {JSON.stringify(step.params, null, 2)}
              </pre>
              {step.error && (
                <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
                  Error: {step.error}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TaskPlanCard({
  plan,
  onApproveAll,
  onStepByStep,
  onEditPlan,
  onCancel,
  isExecuting = false,
  className,
}: TaskPlanCardProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [isApproving, setIsApproving] = useState(false)

  const duration = durationConfig[plan.estimatedDuration]
  const DurationIcon = duration.icon

  const toggleStep = useCallback((stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }, [])

  const handleApproveAll = useCallback(async () => {
    setIsApproving(true)
    try {
      await onApproveAll()
    } finally {
      setIsApproving(false)
    }
  }, [onApproveAll])

  const completedSteps = plan.steps.filter((s) => s.status === 'completed').length
  const totalSteps = plan.steps.length

  return (
    <Card
      className={cn(
        // Premium glassmorphism
        'relative overflow-hidden rounded-xl',
        'bg-gradient-to-br from-background/95 via-background/90 to-background/80',
        'backdrop-blur-xl',
        'border border-white/10',
        'shadow-xl shadow-black/10',
        // Hover effects
        'transition-all duration-300',
        className
      )}
    >
      {/* Gradient accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />

      <CardHeader className="relative pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Icon with glow */}
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/20">
              <ListChecks className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                Task Plan
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] px-1.5 gap-1',
                    duration.color,
                    duration.bgColor,
                    duration.borderColor
                  )}
                >
                  <DurationIcon className="h-3 w-3" />
                  {duration.label}
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalSteps} step{totalSteps !== 1 ? 's' : ''} planned
              </p>
            </div>
          </div>

          {/* Status badge */}
          {plan.status === 'executing' && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Executing
            </Badge>
          )}
        </div>

        {/* Goal */}
        <div className="mt-3 p-3 rounded-lg bg-black/20 border border-white/5">
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm">&quot;{plan.goal}&quot;</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative pb-3">
        {/* Steps list */}
        <ScrollArea className={cn(totalSteps > 4 ? 'h-64' : '')}>
          <div className="space-y-2 pr-2">
            {plan.steps.map((step, index) => (
              <StepItem
                key={step.id}
                step={step}
                index={index}
                isExpanded={expandedSteps.has(step.id)}
                onToggle={() => toggleStep(step.id)}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Progress indicator (when executing) */}
        {plan.status === 'executing' && (
          <div className="mt-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between text-xs text-blue-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Progress
              </span>
              <span>
                {completedSteps}/{totalSteps} completed
              </span>
            </div>
            <div className="mt-1.5 h-1.5 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative pt-0 pb-4 gap-2">
        {/* Cancel button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isExecuting || isApproving}
          className="text-muted-foreground hover:text-foreground"
        >
          <XCircle className="h-4 w-4 mr-1.5" />
          Cancel
        </Button>

        <div className="flex-1" />

        {/* Step-by-step button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onStepByStep}
          disabled={isExecuting || isApproving}
          className="border-white/10 hover:border-white/20"
        >
          <Play className="h-4 w-4 mr-1.5" />
          Step-by-Step
        </Button>

        {/* Approve All button */}
        <Button
          size="sm"
          onClick={handleApproveAll}
          disabled={isExecuting || isApproving}
          className={cn(
            'bg-gradient-to-r from-violet-500 to-purple-500',
            'hover:from-violet-400 hover:to-purple-400',
            'shadow-lg shadow-violet-500/25',
            'transition-all duration-200'
          )}
        >
          {isApproving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Approving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Approve All
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default TaskPlanCard
