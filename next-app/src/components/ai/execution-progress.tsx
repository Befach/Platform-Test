'use client'

/**
 * ExecutionProgress Component
 *
 * Premium UI component for displaying real-time execution progress
 * of multi-step task plans. Shows live updates as each step completes.
 *
 * Features:
 * - Real-time progress bar with gradient animation
 * - Step-by-step status updates
 * - Elapsed time counter
 * - Cancel execution with confirmation
 * - Completion/failure states with summaries
 */

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Square,
  AlertTriangle,
  Sparkles,
  Trophy,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import type { TaskPlan, TaskStep } from '@/lib/ai/task-planner'
import type { ExecutionResult } from '@/lib/ai/agent-loop'

// =============================================================================
// TYPES
// =============================================================================

export interface ExecutionProgressProps {
  plan: TaskPlan
  currentStepIndex: number
  onCancel: () => void
  executionResult?: ExecutionResult
  elapsedTime?: number
  className?: string
}

// =============================================================================
// PREMIUM STYLE CONSTANTS
// =============================================================================

const stepStatusConfig = {
  pending: {
    icon: Clock,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    borderColor: 'border-zinc-500/20',
  },
  running: {
    icon: Loader2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    animate: true,
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  skipped: {
    icon: ChevronRight,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    borderColor: 'border-zinc-500/20',
  },
}

// =============================================================================
// ELAPSED TIME HOOK
// =============================================================================

function useElapsedTime(startTime: number | undefined, isRunning: boolean) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isRunning || !startTime) {
      return
    }

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, isRunning])

  return elapsed
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

// =============================================================================
// STEP STATUS ITEM
// =============================================================================

interface StepStatusItemProps {
  step: TaskStep
  index: number
  isCurrent: boolean
}

function StepStatusItem({ step, index, isCurrent }: StepStatusItemProps) {
  const config = stepStatusConfig[step.status]
  const StatusIcon = config.icon

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg transition-all duration-300',
        isCurrent && step.status === 'running' && 'bg-blue-500/5 border border-blue-500/20',
        step.status === 'completed' && 'opacity-70',
        step.status === 'failed' && 'bg-red-500/5 border border-red-500/20'
      )}
    >
      {/* Status icon */}
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center',
          config.bgColor
        )}
      >
        <StatusIcon
          className={cn(
            'h-3.5 w-3.5',
            config.color,
            'animate' in config && config.animate && 'animate-spin'
          )}
        />
      </div>

      {/* Step info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm truncate',
              step.status === 'completed' && 'line-through text-muted-foreground',
              step.status === 'running' && 'font-medium'
            )}
          >
            {index + 1}. {step.description}
          </span>
        </div>
        {step.status === 'running' && (
          <p className="text-xs text-blue-400 mt-0.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Executing...
          </p>
        )}
        {step.status === 'failed' && step.error && (
          <p className="text-xs text-red-400 mt-0.5 truncate">
            {step.error}
          </p>
        )}
      </div>

      {/* Tool badge */}
      <Badge
        variant="outline"
        className={cn(
          'text-[10px] px-1.5 py-0 h-4 font-mono flex-shrink-0',
          step.status === 'completed' && 'opacity-50'
        )}
      >
        {step.toolName}
      </Badge>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExecutionProgress({
  plan,
  currentStepIndex,
  onCancel,
  executionResult,
  elapsedTime: externalElapsedTime,
  className,
}: ExecutionProgressProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const isRunning = plan.status === 'executing'
  const isCompleted = plan.status === 'completed'
  const isFailed = plan.status === 'failed'
  const isCancelled = plan.status === 'cancelled'

  const completedSteps = plan.steps.filter((s) => s.status === 'completed').length
  const totalSteps = plan.steps.length
  const progress = (completedSteps / totalSteps) * 100

  const internalElapsed = useElapsedTime(plan.createdAt, isRunning)
  const elapsed = externalElapsedTime ?? internalElapsed

  const handleCancel = useCallback(() => {
    setShowCancelDialog(false)
    onCancel()
  }, [onCancel])

  // Determine header style based on status
  const headerGradient = isCompleted
    ? 'from-emerald-500 via-green-500 to-teal-500'
    : isFailed
    ? 'from-red-500 via-rose-500 to-pink-500'
    : isCancelled
    ? 'from-amber-500 via-orange-500 to-yellow-500'
    : 'from-blue-500 via-cyan-500 to-teal-500'

  const overlayGradient = isCompleted
    ? 'from-emerald-500/5 via-transparent to-teal-500/5'
    : isFailed
    ? 'from-red-500/5 via-transparent to-rose-500/5'
    : isCancelled
    ? 'from-amber-500/5 via-transparent to-orange-500/5'
    : 'from-blue-500/5 via-transparent to-cyan-500/5'

  return (
    <Card
      className={cn(
        // Premium glassmorphism
        'relative overflow-hidden rounded-xl',
        'bg-gradient-to-br from-background/95 via-background/90 to-background/80',
        'backdrop-blur-xl',
        'border border-white/10',
        'shadow-xl shadow-black/10',
        className
      )}
    >
      {/* Gradient accent bar */}
      <div className={cn('h-1 w-full bg-gradient-to-r', headerGradient)} />

      {/* Subtle gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br pointer-events-none',
          overlayGradient
        )}
      />

      <CardHeader className="relative pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Status icon with glow */}
            <div
              className={cn(
                'p-2.5 rounded-xl border',
                isCompleted
                  ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 border-emerald-500/20'
                  : isFailed
                  ? 'bg-gradient-to-br from-red-500/20 to-rose-500/10 border-red-500/20'
                  : isCancelled
                  ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/20'
                  : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/20'
              )}
            >
              {isCompleted ? (
                <Trophy className="h-5 w-5 text-emerald-400" />
              ) : isFailed ? (
                <AlertTriangle className="h-5 w-5 text-red-400" />
              ) : isCancelled ? (
                <Square className="h-5 w-5 text-amber-400" />
              ) : (
                <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-base">
                {isCompleted
                  ? 'Execution Complete'
                  : isFailed
                  ? 'Execution Failed'
                  : isCancelled
                  ? 'Execution Cancelled'
                  : 'Executing Plan'}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {completedSteps}/{totalSteps} steps completed
              </p>
            </div>
          </div>

          {/* Time badge */}
          <Badge
            variant="outline"
            className="text-xs gap-1 border-white/10"
          >
            <Clock className="h-3 w-3" />
            {formatTime(elapsed)}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <Progress
            value={progress}
            className="h-2 bg-black/30"
            indicatorClassName={cn(
              'transition-all duration-500',
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                : isFailed
                ? 'bg-gradient-to-r from-red-500 to-rose-500'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            )}
          />
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>{Math.round(progress)}%</span>
            <span>
              {isRunning && currentStepIndex < totalSteps
                ? `Step ${currentStepIndex + 1} of ${totalSteps}`
                : isCompleted
                ? 'All steps completed'
                : isFailed
                ? `Failed at step ${currentStepIndex + 1}`
                : 'Cancelled'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative pb-3">
        {/* Steps list */}
        <ScrollArea className={cn(totalSteps > 5 ? 'h-48' : '')}>
          <div className="space-y-1">
            {plan.steps.map((step, index) => (
              <StepStatusItem
                key={step.id}
                step={step}
                index={index}
                isCurrent={index === currentStepIndex}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Result summary */}
        {executionResult && (isCompleted || isFailed) && (
          <div
            className={cn(
              'mt-3 p-3 rounded-lg border',
              isCompleted
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-red-500/5 border-red-500/20'
            )}
          >
            <div
              className={cn(
                'text-sm font-medium',
                isCompleted ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {isCompleted
                ? `Successfully completed ${executionResult.completedSteps} steps`
                : `Failed after ${executionResult.completedSteps} steps`}
            </div>
            {executionResult.errors.length > 0 && (
              <div className="mt-2 text-xs text-red-400">
                {executionResult.errors.map((error, i) => (
                  <div key={i}>• {error}</div>
                ))}
              </div>
            )}
            {plan.summary && (
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.summary}
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="relative pt-0 pb-4">
        {/* Cancel button (only when running) */}
        {isRunning && (
          <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="w-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
              >
                <Square className="h-4 w-4 mr-1.5" />
                Cancel Execution
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Execution?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will stop the current execution. {completedSteps} step
                  {completedSteps !== 1 ? 's have' : ' has'} already been
                  completed and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Execution</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Yes, Cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Done state */}
        {(isCompleted || isFailed || isCancelled) && (
          <div className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {isCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Plan executed successfully</span>
              </>
            ) : isFailed ? (
              <>
                <XCircle className="h-4 w-4 text-red-400" />
                <span>Execution failed</span>
              </>
            ) : (
              <>
                <Square className="h-4 w-4 text-amber-400" />
                <span>Execution was cancelled</span>
              </>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

export default ExecutionProgress
