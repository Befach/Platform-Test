'use client'

/**
 * Feedback Triage Dialog
 *
 * Dialog for triaging feedback - preview content and choose action
 * (implement, defer, or reject)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { FeedbackWithRelations, FeedbackDecision } from '@/lib/types/feedback'

interface FeedbackTriageDialogProps {
  feedback: FeedbackWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function FeedbackTriageDialog({
  feedback,
  open,
  onOpenChange,
  onSuccess,
}: FeedbackTriageDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [decision, setDecision] = useState<FeedbackDecision>('implement')
  const [decisionReason, setDecisionReason] = useState('')

  if (!feedback) return null

  async function handleTriage() {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/feedback/${feedback.id}/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          decision_reason: decisionReason || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to triage feedback')
      }

      toast({
        title: 'Feedback triaged',
        description: `Feedback marked as "${decision}"`,
      })

      router.refresh()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to triage feedback',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function getSourceBadge(source: string) {
    const colors = {
      internal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      customer: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      user: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    }
    return colors[source as keyof typeof colors] || colors.user
  }

  function getPriorityBadge(priority: string) {
    const colors = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }
    return colors[priority as keyof typeof colors] || colors.low
  }

  function getDecisionIcon(dec: FeedbackDecision) {
    switch (dec) {
      case 'implement':
        return <CheckCircle className="h-4 w-4 mr-2" />
      case 'defer':
        return <Clock className="h-4 w-4 mr-2" />
      case 'reject':
        return <XCircle className="h-4 w-4 mr-2" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Triage Feedback</DialogTitle>
          <DialogDescription>
            Review feedback and decide how to proceed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feedback Metadata */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getSourceBadge(feedback.source)}>
              {feedback.source}
            </Badge>
            <Badge className={getPriorityBadge(feedback.priority)}>
              {feedback.priority} priority
            </Badge>
            {feedback.work_item && (
              <Badge variant="outline">
                Related to: {feedback.work_item.name}
              </Badge>
            )}
          </div>

          {/* Feedback Source Info */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">From:</span> {feedback.source_name}
              </div>
              {feedback.source_role && (
                <div>
                  <span className="font-medium">Role:</span> {feedback.source_role}
                </div>
              )}
              {feedback.source_email && (
                <div className="col-span-2">
                  <span className="font-medium">Email:</span> {feedback.source_email}
                </div>
              )}
              <div className="col-span-2">
                <span className="font-medium">Received:</span>{' '}
                {new Date(feedback.received_at || feedback.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Feedback Content */}
          <div className="space-y-2">
            <Label>Feedback Content</Label>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{feedback.content}</p>
            </div>
          </div>

          {/* Context (if any) */}
          {feedback.context && (
            <div className="space-y-2">
              <Label>Additional Context</Label>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{feedback.context}</p>
              </div>
            </div>
          )}

          {/* Decision Selector */}
          <div className="space-y-2">
            <Label htmlFor="decision">Decision *</Label>
            <Select value={decision} onValueChange={(value) => setDecision(value as FeedbackDecision)}>
              <SelectTrigger id="decision">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="implement">
                  <div className="flex items-center">
                    {getDecisionIcon('implement')}
                    <span>Implement - Convert to work item</span>
                  </div>
                </SelectItem>
                <SelectItem value="defer">
                  <div className="flex items-center">
                    {getDecisionIcon('defer')}
                    <span>Defer - Revisit later</span>
                  </div>
                </SelectItem>
                <SelectItem value="reject">
                  <div className="flex items-center">
                    {getDecisionIcon('reject')}
                    <span>Reject - Will not implement</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Decision Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Why did you make this decision? This helps track feedback rationale..."
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {decision === 'implement' && 'Next: You can convert this to a work item after triaging'}
              {decision === 'defer' && 'This feedback will be marked as deferred for future review'}
              {decision === 'reject' && 'This feedback will be marked as rejected'}
            </p>
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
          <Button onClick={handleTriage} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Processing...' : `Mark as ${decision}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
