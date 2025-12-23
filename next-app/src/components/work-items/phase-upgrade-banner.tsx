/**
 * Phase Upgrade Banner
 *
 * Displays a banner prompting users to upgrade their work item phase
 * when readiness reaches 80% or higher.
 *
 * Features:
 * - Progress bar showing readiness percentage
 * - Phase badges (current → next) with colors
 * - Missing required fields list with hints
 * - Upgrade button (disabled until all required fields complete)
 * - Dismiss option with 24h persistence
 * - Guiding question tooltip
 *
 * @module components/work-items/phase-upgrade-banner
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Lightbulb,
  Loader2,
} from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import {
  getTypePhaseConfig,
  type WorkspacePhase,
  type WorkItemType,
} from '@/lib/constants/workspace-phases'
import type { PhaseReadiness } from '@/lib/phase/readiness-calculator'
import type { PhaseGuidance } from '@/lib/phase/guiding-questions'
import { dismissBanner, clearDismissal } from '@/hooks/use-phase-readiness'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for PhaseUpgradeBanner
 */
export interface PhaseUpgradeBannerProps {
  /** Work item ID for API calls and dismissal tracking */
  workItemId: string
  /** Work item type for type-aware phase config lookup */
  workItemType?: WorkItemType
  /** Phase readiness calculation result */
  readiness: PhaseReadiness
  /** Guidance for current phase */
  guidance: PhaseGuidance
  /** Callback when phase upgrade is successful */
  onUpgradeSuccess?: (newPhase: string) => void
  /** Optional additional class names */
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Banner component that prompts users to upgrade work item phase
 *
 * Shows when:
 * - readinessPercent >= 80%
 * - nextPhase exists
 * - Banner hasn't been dismissed recently
 *
 * @example
 * ```tsx
 * <PhaseUpgradeBanner
 *   workItemId="123"
 *   readiness={readinessData}
 *   guidance={guidanceData}
 *   onUpgradeSuccess={(phase) => console.log('Upgraded to', phase)}
 * />
 * ```
 */
export function PhaseUpgradeBanner({
  workItemId,
  workItemType = 'feature',
  readiness,
  guidance,
  onUpgradeSuccess,
  className,
}: PhaseUpgradeBannerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Get type-aware phase configs
  const effectiveType = readiness.workItemType || workItemType
  const currentPhaseConfig = getTypePhaseConfig(effectiveType, readiness.currentPhase)
  const nextPhaseConfig = readiness.nextPhase
    ? getTypePhaseConfig(effectiveType, readiness.nextPhase)
    : null

  /**
   * Handle phase upgrade via API
   */
  const handleUpgrade = useCallback(async () => {
    if (!readiness.canUpgrade || !readiness.nextPhase) return

    setIsUpgrading(true)
    try {
      const response = await fetch(`/api/work-items/${workItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: readiness.nextPhase }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upgrade phase')
      }

      // Clear dismissal record since phase changed
      clearDismissal(workItemId)

      toast({
        title: 'Phase Upgraded!',
        description: `Work item moved to ${nextPhaseConfig?.name} phase`,
      })

      // Refresh to show updated data
      router.refresh()

      onUpgradeSuccess?.(readiness.nextPhase)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not upgrade phase'
      toast({
        title: 'Upgrade Failed',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsUpgrading(false)
    }
  }, [
    workItemId,
    readiness.canUpgrade,
    readiness.nextPhase,
    nextPhaseConfig?.name,
    toast,
    router,
    onUpgradeSuccess,
  ])

  /**
   * Handle dismiss - persist to localStorage
   */
  const handleDismiss = useCallback(() => {
    dismissBanner(
      workItemId,
      readiness.currentPhase as WorkspacePhase,
      readiness.readinessPercent
    )
    setIsDismissed(true)
  }, [workItemId, readiness.currentPhase, readiness.readinessPercent])

  // Don't render if dismissed, no next phase, or missing config
  if (isDismissed || !nextPhaseConfig || !currentPhaseConfig) {
    return null
  }

  // Get first guiding question for tooltip (deterministic)
  const guidingQuestion = guidance.questions[0]

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out',
        className
      )}
    >
      <Alert
        className={cn(
          'relative border-2',
          readiness.canUpgrade
            ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
            : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
        )}
      >
        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 opacity-60 hover:opacity-100"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Icon */}
        {readiness.canUpgrade ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-600" />
        )}

        {/* Title */}
        <AlertTitle className="flex items-center gap-2 pr-8">
          {readiness.canUpgrade ? (
            <>Ready to move to {nextPhaseConfig.name}!</>
          ) : (
            <>Almost ready for {nextPhaseConfig.name}</>
          )}
        </AlertTitle>

        <AlertDescription className="mt-3 space-y-4">
          {/* Phase transition visualization */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              className={cn(
                'font-medium',
                currentPhaseConfig.bgColor,
                currentPhaseConfig.textColor
              )}
            >
              {currentPhaseConfig.emoji} {currentPhaseConfig.name}
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge
              className={cn(
                'font-medium',
                nextPhaseConfig.bgColor,
                nextPhaseConfig.textColor
              )}
            >
              {nextPhaseConfig.emoji} {nextPhaseConfig.name}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Readiness</span>
              <span className="font-medium">{readiness.readinessPercent}%</span>
            </div>
            <Progress
              value={readiness.readinessPercent}
              className="h-2"
              indicatorClassName={
                readiness.canUpgrade ? 'bg-green-500' : 'bg-amber-500'
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Required: {readiness.breakdown.requiredPercent}%
              </span>
              <span>
                Optional: {readiness.breakdown.optionalPercent}%
              </span>
            </div>
          </div>

          {/* Missing fields (if not ready) */}
          {!readiness.canUpgrade && readiness.missingFields.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Complete these to proceed:</p>
              <ul className="space-y-1.5">
                {readiness.missingFields.map((field) => (
                  <li
                    key={field.field}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{field.label}</span>
                      <span className="text-muted-foreground">
                        {' '}
                        - {field.hint}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Guiding question tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xs text-muted-foreground cursor-help w-fit">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>Guiding question for this phase</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium">{guidingQuestion.question}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {guidingQuestion.purpose}
                </p>
                {guidingQuestion.designThinkingMethod && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {guidingQuestion.designThinkingMethod}
                  </Badge>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <Button
              onClick={handleUpgrade}
              disabled={!readiness.canUpgrade || isUpgrading}
              className={cn(
                readiness.canUpgrade
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : ''
              )}
              variant={readiness.canUpgrade ? 'default' : 'secondary'}
            >
              {isUpgrading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {readiness.canUpgrade
                ? `Upgrade to ${nextPhaseConfig.name}`
                : 'Complete Required Fields'}
            </Button>
            {!readiness.canUpgrade && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-muted-foreground"
              >
                Remind me later
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
