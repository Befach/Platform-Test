'use client'

/**
 * Review Status Panel Component
 *
 * Displays and manages the review status for work items.
 * Shows current status, allows actions based on permissions,
 * and displays review history.
 *
 * @module components/work-items/review-status-panel
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type ReviewStatus as ReviewStatusType,
  type ReviewerRole,
  canRequestReview,
  canApproveReview,
  canRejectReview,
  canCancelReview,
  getReviewStatusLabel,
  getReviewStatusColor,
  type ReviewableWorkItem,
} from '@/lib/phase/review-process'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ReviewStatusPanelProps {
  /** Work item ID */
  workItemId: string
  /** Whether review is enabled for this work item */
  reviewEnabled: boolean
  /** Current review status */
  reviewStatus: ReviewStatusType | null
  /** Current user's role */
  userRole: ReviewerRole
  /** Work item type */
  type: string
  /** Current phase */
  phase: string
  /** Callback when status changes */
  onStatusChange?: (status: ReviewStatusType | null) => void
  /** Additional class names */
  className?: string
  /** Compact mode for inline display */
  compact?: boolean
}

// ============================================================================
// REJECTION DIALOG
// ============================================================================

interface RejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  isSubmitting: boolean
}

function RejectDialog({ open, onOpenChange, onConfirm, isSubmitting }: RejectDialogProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Review</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this review. This will help
            the team understand what needs to be addressed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this work item is not ready for approval..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Review Status component
 *
 * @example
 * ```tsx
 * <ReviewStatusPanel
 *   workItemId={workItem.id}
 *   reviewEnabled={workItem.review_enabled}
 *   reviewStatus={workItem.review_status}
 *   userRole="admin"
 *   type="feature"
 *   phase="build"
 *   onStatusChange={(status) => console.log('New status:', status)}
 * />
 * ```
 */
export function ReviewStatusPanel({
  workItemId,
  reviewEnabled,
  reviewStatus,
  userRole,
  type,
  phase,
  onStatusChange,
  className,
  compact = false,
}: ReviewStatusPanelProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  // Create a work item object for permission checks
  const workItem: ReviewableWorkItem = {
    id: workItemId,
    type,
    phase,
    review_enabled: reviewEnabled,
    review_status: reviewStatus,
  }

  // Check permissions
  const canRequest = canRequestReview(workItem, userRole)
  const canApprove = canApproveReview(workItem, userRole)
  const canReject = canRejectReview(workItem, userRole)
  const canCancel = canCancelReview(workItem, userRole)

  // Get status styling
  const statusColors = getReviewStatusColor(reviewStatus)
  const statusLabel = getReviewStatusLabel(reviewStatus)

  // Handle review action
  const handleAction = useCallback(
    async (action: 'request' | 'approve' | 'reject' | 'cancel', reason?: string) => {
      setIsSubmitting(true)
      try {
        const response = await fetch(`/api/work-items/${workItemId}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, reason }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update review status')
        }

        toast({
          title: 'Review Updated',
          description: getActionSuccessMessage(action),
        })

        onStatusChange?.(result.review_status)
        setRejectDialogOpen(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update review'
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [workItemId, toast, onStatusChange]
  )

  // Don't show if review is not enabled
  if (!reviewEnabled) {
    return null
  }

  // Compact mode - just show the badge
  if (compact) {
    return (
      <Badge
        className={cn(statusColors.bg, statusColors.text, 'border', statusColors.border)}
      >
        {getStatusIcon(reviewStatus)}
        <span className="ml-1">{statusLabel}</span>
      </Badge>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Status display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Review Status:</span>
          <Badge
            className={cn(
              statusColors.bg,
              statusColors.text,
              'border',
              statusColors.border
            )}
          >
            {getStatusIcon(reviewStatus)}
            <span className="ml-1.5">{statusLabel}</span>
          </Badge>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Request Review */}
        {canRequest && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction('request')}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Request Review
          </Button>
        )}

        {/* Approve */}
        {canApprove && (
          <Button
            size="sm"
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleAction('approve')}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Approve
          </Button>
        )}

        {/* Reject */}
        {canReject && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setRejectDialogOpen(true)}
            disabled={isSubmitting}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        )}

        {/* Cancel */}
        {canCancel && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAction('cancel')}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Request
          </Button>
        )}
      </div>

      {/* Status message */}
      {reviewStatus === 'pending' && (
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4" />
          Awaiting stakeholder review before proceeding
        </p>
      )}

      {reviewStatus === 'rejected' && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <XCircle className="h-4 w-4" />
          Review was rejected. Address feedback and request again.
        </p>
      )}

      {reviewStatus === 'approved' && (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4" />
          Review approved. Ready to proceed to next phase.
        </p>
      )}

      {/* Rejection dialog */}
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={(reason) => handleAction('reject', reason)}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function getStatusIcon(status: ReviewStatusType | null) {
  switch (status) {
    case 'pending':
      return <Clock className="h-3.5 w-3.5" />
    case 'approved':
      return <CheckCircle2 className="h-3.5 w-3.5" />
    case 'rejected':
      return <XCircle className="h-3.5 w-3.5" />
    default:
      return null
  }
}

function getActionSuccessMessage(action: string): string {
  switch (action) {
    case 'request':
      return 'Review has been requested'
    case 'approve':
      return 'Work item has been approved'
    case 'reject':
      return 'Work item has been rejected'
    case 'cancel':
      return 'Review request has been cancelled'
    default:
      return 'Review status updated'
  }
}

export default ReviewStatusPanel
