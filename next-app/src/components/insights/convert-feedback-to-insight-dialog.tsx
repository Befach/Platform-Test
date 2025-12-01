'use client'

/**
 * Convert Feedback to Insight Dialog
 *
 * Dialog for converting feedback items into customer insights.
 * Pre-fills form with feedback data and maintains the source link.
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
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Lightbulb, ArrowRight, X, Plus } from 'lucide-react'
import type {
  InsightSource,
  InsightSentiment,
} from '@/lib/types/customer-insight'
import {
  INSIGHT_SENTIMENTS,
} from '@/lib/types/customer-insight'

// Feedback type for this component
interface FeedbackItem {
  id: string
  content: string
  source: 'internal' | 'customer' | 'user'
  source_name: string
  source_email?: string
  source_role?: string
  workspace_id?: string
  team_id: string
}

interface ConvertFeedbackToInsightDialogProps {
  feedback: FeedbackItem | null
  teamId: string
  workspaceId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (insightId: string) => void
}

// Sentiment labels for display
const sentimentLabels: Record<InsightSentiment, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  mixed: 'Mixed',
}

// Map feedback source to insight source
function feedbackSourceToInsightSource(feedbackSource: string): InsightSource {
  switch (feedbackSource) {
    case 'internal':
      return 'feedback'
    case 'customer':
      return 'feedback'
    case 'user':
      return 'feedback'
    default:
      return 'feedback'
  }
}

export function ConvertFeedbackToInsightDialog({
  feedback,
  teamId,
  workspaceId,
  open,
  onOpenChange,
  onSuccess,
}: ConvertFeedbackToInsightDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [quote, setQuote] = useState('')
  const [painPoint, setPainPoint] = useState('')
  const [sentiment, setSentiment] = useState<InsightSentiment>('neutral')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerSegment, setCustomerSegment] = useState('')
  const [impactScore, setImpactScore] = useState(5)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Initialize form with feedback data when dialog opens
  useEffect(() => {
    if (open && feedback) {
      // Generate suggested title from content
      const suggestedTitle = feedback.content.length > 80
        ? feedback.content.substring(0, 77) + '...'
        : feedback.content

      setTitle(suggestedTitle)
      setQuote(feedback.content)
      setPainPoint('')
      setSentiment('neutral')
      setCustomerName(feedback.source_name || '')
      setCustomerEmail(feedback.source_email || '')
      setCustomerSegment(
        feedback.source === 'customer'
          ? 'customer'
          : feedback.source === 'internal'
            ? 'internal'
            : 'user'
      )
      setImpactScore(5)
      setTags([])
      setTagInput('')
    }
  }, [open, feedback])

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  async function handleConvert() {
    if (!feedback) return

    // Validate required fields
    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          workspace_id: workspaceId || feedback.workspace_id || undefined,
          title: title.trim(),
          quote: quote || undefined,
          pain_point: painPoint || undefined,
          source: feedbackSourceToInsightSource(feedback.source),
          customer_name: customerName || undefined,
          customer_email: customerEmail || undefined,
          customer_segment: customerSegment || undefined,
          sentiment,
          impact_score: impactScore,
          tags,
          source_feedback_id: feedback.id, // Link to original feedback
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create insight')
      }

      const data = await response.json()

      toast({
        title: 'Insight created',
        description: `Converted feedback to insight: "${title}"`,
      })

      router.refresh()
      onOpenChange(false)
      onSuccess?.(data.data.id)
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

  function getSourceBadgeColor(source: string) {
    const colors = {
      internal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      customer: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      user: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    }
    return colors[source as keyof typeof colors] || colors.user
  }

  if (!feedback) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Convert Feedback to Insight
          </DialogTitle>
          <DialogDescription>
            Create a customer insight from this feedback
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original Feedback Preview */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Source Feedback</span>
                <Badge className={getSourceBadgeColor(feedback.source)}>
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

          {/* Insight Form */}
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Insight Title *</Label>
              <Input
                id="title"
                placeholder="E.g., Users struggle with dashboard navigation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/200 characters
              </p>
            </div>

            {/* Quote (pre-filled with feedback content) */}
            <div className="space-y-2">
              <Label htmlFor="quote">Customer Quote</Label>
              <Textarea
                id="quote"
                placeholder="Direct quote from the customer"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Pre-filled from feedback content
              </p>
            </div>

            {/* Pain Point */}
            <div className="space-y-2">
              <Label htmlFor="pain_point">Pain Point / Problem</Label>
              <Textarea
                id="pain_point"
                placeholder="What specific problem does this feedback highlight?"
                value={painPoint}
                onChange={(e) => setPainPoint(e.target.value)}
                rows={2}
              />
            </div>

            {/* Sentiment */}
            <div className="space-y-2">
              <Label htmlFor="sentiment">Sentiment</Label>
              <Select
                value={sentiment}
                onValueChange={(value) => setSentiment(value as InsightSentiment)}
              >
                <SelectTrigger id="sentiment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSIGHT_SENTIMENTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {sentimentLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Info (pre-filled) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_email">Customer Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Impact Score */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Impact Score</Label>
                <span className="text-sm font-medium">{impactScore}/10</span>
              </div>
              <Slider
                value={[impactScore]}
                onValueChange={([value]) => setImpactScore(value)}
                min={0}
                max={10}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                How impactful is addressing this insight?
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button type="button" variant="outline" size="icon" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> This insight will be linked to the original
                feedback via the <code>source_feedback_id</code> field, allowing you
                to trace insights back to their source.
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
          <Button onClick={handleConvert} disabled={isSubmitting || !title.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Insight'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
