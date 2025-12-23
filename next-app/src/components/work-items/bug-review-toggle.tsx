'use client'

/**
 * Bug Review Toggle
 *
 * Toggle component for enabling/disabling the review process on bug work items.
 * When enabled, bugs cannot move to the 'verified' phase until review is approved.
 *
 * @module components/work-items/bug-review-toggle
 */

import { useState, useCallback } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Review status values
 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | null

/**
 * Props for BugReviewToggle
 */
export interface BugReviewToggleProps {
  /** Work item ID for API calls */
  workItemId: string
  /** Whether review is currently enabled */
  reviewEnabled: boolean
  /** Current review status (if enabled) */
  reviewStatus?: ReviewStatus
  /** Callback when toggle state changes */
  onToggle: (enabled: boolean) => Promise<void>
  /** Whether the toggle is disabled */
  disabled?: boolean
  /** Additional class names */
  className?: string
  /** Show in compact mode (icon only) */
  compact?: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const REVIEW_STATUS_CONFIG: Record<
  NonNullable<ReviewStatus>,
  { label: string; icon: typeof Clock; color: string }
> = {
  pending: {
    label: 'Pending Review',
    icon: Clock,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Toggle component for enabling review process on bugs
 *
 * @example
 * ```tsx
 * <BugReviewToggle
 *   workItemId="123"
 *   reviewEnabled={bug.review_enabled}
 *   reviewStatus={bug.review_status}
 *   onToggle={async (enabled) => {
 *     await updateWorkItem(bug.id, { review_enabled: enabled })
 *   }}
 * />
 * ```
 */
export function BugReviewToggle({
  workItemId,
  reviewEnabled,
  reviewStatus,
  onToggle,
  disabled = false,
  className,
  compact = false,
}: BugReviewToggleProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [localEnabled, setLocalEnabled] = useState(reviewEnabled)

  /**
   * Handle toggle state change
   */
  const handleToggle = useCallback(
    async (checked: boolean) => {
      if (disabled || isUpdating) return

      setIsUpdating(true)
      setLocalEnabled(checked) // Optimistic update

      try {
        await onToggle(checked)
        toast({
          title: checked ? 'Review Enabled' : 'Review Disabled',
          description: checked
            ? 'This bug now requires stakeholder review before verification'
            : 'Bug can now be verified without additional review',
        })
      } catch (error: unknown) {
        // Revert on error
        setLocalEnabled(!checked)
        const message =
          error instanceof Error ? error.message : 'Failed to update review status'
        toast({
          title: 'Update Failed',
          description: message,
          variant: 'destructive',
        })
      } finally {
        setIsUpdating(false)
      }
    },
    [disabled, isUpdating, onToggle, toast]
  )

  // Get current status config if enabled
  const statusConfig = reviewStatus ? REVIEW_STATUS_CONFIG[reviewStatus] : null
  const StatusIcon = statusConfig?.icon

  // Compact mode - just icon and switch
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-2', className)}>
              <ShieldCheck
                className={cn(
                  'h-4 w-4',
                  localEnabled ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <Switch
                checked={localEnabled}
                onCheckedChange={handleToggle}
                disabled={disabled || isUpdating}
                aria-label="Require stakeholder review"
              />
              {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
              {localEnabled && statusConfig && (
                <Badge className={cn('text-xs', statusConfig.color)}>
                  {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                  {statusConfig.label}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {localEnabled
                ? 'Review required before verification'
                : 'Enable stakeholder review'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Full mode with label and description
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className={cn(
              'h-5 w-5',
              localEnabled ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <div className="space-y-0.5">
            <Label
              htmlFor={`review-toggle-${workItemId}`}
              className="text-sm font-medium cursor-pointer"
            >
              Require Stakeholder Review
            </Label>
            <p className="text-xs text-muted-foreground">
              Bug must be reviewed before moving to verified
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  When enabled, this bug fix requires approval from a team owner
                  or admin before it can be marked as verified. This ensures
                  quality control for critical bug fixes.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
          <Switch
            id={`review-toggle-${workItemId}`}
            checked={localEnabled}
            onCheckedChange={handleToggle}
            disabled={disabled || isUpdating}
            aria-label="Require stakeholder review"
          />
        </div>
      </div>

      {/* Review Status Badge (when enabled) */}
      {localEnabled && (
        <div className="flex items-center gap-2 ml-7">
          {statusConfig ? (
            <Badge className={cn('flex items-center gap-1', statusConfig.color)}>
              {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
              {statusConfig.label}
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Not yet requested
            </Badge>
          )}

          {reviewStatus === 'rejected' && (
            <span className="text-xs text-muted-foreground">
              Review was rejected. Address feedback and request again.
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default BugReviewToggle
