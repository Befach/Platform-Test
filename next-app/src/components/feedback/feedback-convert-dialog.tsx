'use client'

/**
 * Feedback Convert Dialog
 *
 * Dialog for converting feedback into a work item
 * Allows selecting type and customizing name/purpose
 */

import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
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
import { Loader2, Sparkles, ArrowRight } from 'lucide-react'
import type { FeedbackWithRelations } from '@/lib/types/feedback'
import type { WorkItemType } from '@/lib/constants/work-item-types'
import {
  WORK_ITEM_TYPES,
  getItemLabel,
  getItemIcon,
  getItemDescription,
} from '@/lib/constants/work-item-types'

interface FeedbackConvertDialogProps {
  feedback: FeedbackWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (workItemId: string) => void
}

export function FeedbackConvertDialog({
  feedback,
  open,
  onOpenChange,
  onSuccess,
}: FeedbackConvertDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workItemType, setWorkItemType] = useState<WorkItemType>('feature')
  const [workItemName, setWorkItemName] = useState('')
  const [workItemPurpose, setWorkItemPurpose] = useState('')

  // Initialize form with feedback data when dialog opens
  useEffect(() => {
    if (open && feedback) {
      // Pre-fill name with feedback source or content preview
      const suggestedName = feedback.source_name
        ? `Feedback from ${feedback.source_name}`
        : 'Feedback'
      setWorkItemName(suggestedName)

      // Pre-fill purpose with feedback content
      setWorkItemPurpose(feedback.content)
    }
  }, [open, feedback])

  if (!feedback) return null

  async function handleConvert() {
    // Validate required fields
    if (!workItemName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Work item name is required',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/feedback/${feedback.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_item_type: workItemType,
          work_item_name: workItemName,
          work_item_purpose: workItemPurpose || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to convert feedback')
      }

      const data = await response.json()

      toast({
        title: 'Feedback converted',
        description: `Created ${getItemLabel(workItemType)}: ${workItemName}`,
      })

      router.refresh()
      onOpenChange(false)
      onSuccess?.(data.work_item.id)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to convert feedback',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Convert Feedback to Work Item
          </DialogTitle>
          <DialogDescription>
            Create a new work item from this feedback
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feedback Preview */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Source Feedback</span>
                <Badge className={getSourceBadge(feedback.source)}>
                  {feedback.source}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                from {feedback.source_name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {feedback.content}
            </p>
          </div>

          {/* Arrow Indicator */}
          <div className="flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Work Item Form */}
          <div className="space-y-4">
            {/* Work Item Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Work Item Type *</Label>
              <Select
                value={workItemType}
                onValueChange={(value) => setWorkItemType(value as WorkItemType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(WORK_ITEM_TYPES).map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <span>{getItemIcon(type)}</span>
                        <span>{getItemLabel(type)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getItemDescription(workItemType)}
              </p>
            </div>

            {/* Work Item Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Work Item Name *</Label>
              <Input
                id="name"
                placeholder="E.g., Add dark mode toggle"
                value={workItemName}
                onChange={(e) => setWorkItemName(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {workItemName.length}/200 characters
              </p>
            </div>

            {/* Work Item Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose / Description</Label>
              <Textarea
                id="purpose"
                placeholder="What is this work item about? Why is it needed?"
                value={workItemPurpose}
                onChange={(e) => setWorkItemPurpose(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Pre-filled with feedback content. You can edit or expand as needed.
              </p>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> After conversion, the feedback will be marked as
                "implemented" and linked to this new work item. You can add more details
                (acceptance criteria, timeline, etc.) after creation.
              </p>
            </div>
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
          <Button onClick={handleConvert} disabled={isSubmitting || !workItemName.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : `Create ${getItemLabel(workItemType)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
