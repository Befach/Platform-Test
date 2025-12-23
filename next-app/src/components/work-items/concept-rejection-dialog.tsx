'use client'

/**
 * Concept Rejection Dialog
 *
 * Captures rejection reason and optional archival when rejecting a concept.
 *
 * Fields:
 * - Rejection reason (required, min 10 characters)
 * - Archive checkbox (optional, hides from active views)
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

// =============================================================================
// CONSTANTS
// =============================================================================

const MIN_REJECTION_REASON_LENGTH = 10
const MAX_REJECTION_REASON_LENGTH = 5000

// =============================================================================
// TYPES
// =============================================================================

interface ConceptRejectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string, archive: boolean) => Promise<void>
  conceptName: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ConceptRejectionDialog({
  open,
  onOpenChange,
  onConfirm,
  conceptName,
}: ConceptRejectionDialogProps) {
  const [reason, setReason] = useState('')
  const [archive, setArchive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reasonLength = reason.trim().length
  const isReasonValid =
    reasonLength >= MIN_REJECTION_REASON_LENGTH &&
    reasonLength <= MAX_REJECTION_REASON_LENGTH

  const handleSubmit = async () => {
    if (!isReasonValid) return

    setIsSubmitting(true)
    try {
      await onConfirm(reason, archive)
      // Reset form on success
      setReason('')
      setArchive(false)
    } catch (error) {
      console.error('Failed to reject concept:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Reset form when closing
      setReason('')
      setArchive(false)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Reject Concept
          </DialogTitle>
          <DialogDescription>
            Document why &quot;{conceptName}&quot; is being rejected. This helps
            with future decision-making.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rejection Reason */}
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              Rejection Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this concept is not moving forward (e.g., technical infeasibility, market fit, resource constraints...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isSubmitting}
              maxLength={MAX_REJECTION_REASON_LENGTH}
            />
            <p className={`text-xs ${reasonLength > MAX_REJECTION_REASON_LENGTH ? 'text-red-500' : 'text-muted-foreground'}`}>
              {reasonLength < MIN_REJECTION_REASON_LENGTH
                ? `Minimum ${MIN_REJECTION_REASON_LENGTH} characters required (${reasonLength}/${MIN_REJECTION_REASON_LENGTH})`
                : `${reasonLength}/${MAX_REJECTION_REASON_LENGTH} characters`
              }
            </p>
          </div>

          {/* Archive Checkbox */}
          <div className="flex items-start space-x-3 rounded-lg border p-4">
            <Checkbox
              id="archive-concept"
              checked={archive}
              onCheckedChange={(checked) => setArchive(checked as boolean)}
              disabled={isSubmitting}
            />
            <div className="space-y-1 flex-1">
              <Label
                htmlFor="archive-concept"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Archive this concept
              </Label>
              <p className="text-sm text-muted-foreground">
                Hide from active views (can be restored later)
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!isReasonValid || isSubmitting}
          >
            {isSubmitting ? 'Rejecting...' : 'Reject Concept'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
