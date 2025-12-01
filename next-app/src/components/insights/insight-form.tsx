'use client'

/**
 * Insight Form Component
 *
 * Form for creating and editing customer insights.
 * Supports all insight fields with validation.
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
import { Loader2, Lightbulb, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  CustomerInsight,
  InsightFormData,
  InsightSource,
  InsightSentiment,
} from '@/lib/types/customer-insight'
import {
  INSIGHT_SOURCES,
  INSIGHT_SENTIMENTS,
  DEFAULT_INSIGHT_FORM,
} from '@/lib/types/customer-insight'

interface InsightFormDialogProps {
  teamId: string
  workspaceId?: string
  insight?: CustomerInsight | null // For editing
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (insight: CustomerInsight) => void
}

// Source labels for display
const sourceLabels: Record<InsightSource, string> = {
  feedback: 'Feedback',
  support: 'Support Ticket',
  interview: 'Customer Interview',
  survey: 'Survey Response',
  social: 'Social Media',
  analytics: 'Analytics Data',
  other: 'Other Source',
}

// Sentiment labels for display
const sentimentLabels: Record<InsightSentiment, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  mixed: 'Mixed',
}

export function InsightFormDialog({
  teamId,
  workspaceId,
  insight,
  open,
  onOpenChange,
  onSuccess,
}: InsightFormDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<InsightFormData>(DEFAULT_INSIGHT_FORM)
  const [tagInput, setTagInput] = useState('')

  const isEditing = !!insight

  // Initialize form with insight data when editing
  useEffect(() => {
    if (open) {
      if (insight) {
        setFormData({
          title: insight.title,
          quote: insight.quote || '',
          pain_point: insight.pain_point || '',
          context: insight.context || '',
          source: insight.source,
          source_url: insight.source_url || '',
          source_date: insight.source_date || '',
          customer_name: insight.customer_name || '',
          customer_email: insight.customer_email || '',
          customer_segment: insight.customer_segment || '',
          customer_company: insight.customer_company || '',
          sentiment: insight.sentiment,
          impact_score: insight.impact_score,
          tags: insight.tags || [],
        })
      } else {
        setFormData(DEFAULT_INSIGHT_FORM)
      }
      setTagInput('')
    }
  }, [open, insight])

  const handleChange = (
    field: keyof InsightFormData,
    value: string | number | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  async function handleSubmit() {
    // Validate required fields
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const url = isEditing ? `/api/insights/${insight.id}` : '/api/insights'
      const method = isEditing ? 'PATCH' : 'POST'

      const payload = isEditing
        ? {
            title: formData.title,
            quote: formData.quote || undefined,
            pain_point: formData.pain_point || undefined,
            context: formData.context || undefined,
            source: formData.source,
            source_url: formData.source_url || undefined,
            source_date: formData.source_date || undefined,
            customer_name: formData.customer_name || undefined,
            customer_email: formData.customer_email || undefined,
            customer_segment: formData.customer_segment || undefined,
            customer_company: formData.customer_company || undefined,
            sentiment: formData.sentiment,
            impact_score: formData.impact_score,
            tags: formData.tags,
          }
        : {
            team_id: teamId,
            workspace_id: workspaceId || undefined,
            title: formData.title,
            quote: formData.quote || undefined,
            pain_point: formData.pain_point || undefined,
            context: formData.context || undefined,
            source: formData.source,
            source_url: formData.source_url || undefined,
            source_date: formData.source_date || undefined,
            customer_name: formData.customer_name || undefined,
            customer_email: formData.customer_email || undefined,
            customer_segment: formData.customer_segment || undefined,
            customer_company: formData.customer_company || undefined,
            sentiment: formData.sentiment,
            impact_score: formData.impact_score,
            tags: formData.tags,
          }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} insight`)
      }

      const data = await response.json()

      toast({
        title: isEditing ? 'Insight updated' : 'Insight created',
        description: `"${formData.title}" has been ${isEditing ? 'updated' : 'saved'}`,
      })

      router.refresh()
      onOpenChange(false)
      onSuccess?.(data.data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} insight`,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            {isEditing ? 'Edit Insight' : 'New Customer Insight'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the insight details'
              : 'Capture a customer insight from feedback, interviews, or other sources'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title (Required) */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="E.g., Users struggle with dashboard navigation"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Quote */}
          <div className="space-y-2">
            <Label htmlFor="quote">Customer Quote</Label>
            <Textarea
              id="quote"
              placeholder='"I spend too much time clicking around to find what I need..."'
              value={formData.quote}
              onChange={(e) => handleChange('quote', e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Direct quote from the customer (if available)
            </p>
          </div>

          {/* Pain Point */}
          <div className="space-y-2">
            <Label htmlFor="pain_point">Pain Point / Problem</Label>
            <Textarea
              id="pain_point"
              placeholder="What specific problem or pain point does this insight address?"
              value={formData.pain_point}
              onChange={(e) => handleChange('pain_point', e.target.value)}
              rows={3}
            />
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Additional Context</Label>
            <Textarea
              id="context"
              placeholder="Any additional context about this insight..."
              value={formData.context}
              onChange={(e) => handleChange('context', e.target.value)}
              rows={2}
            />
          </div>

          {/* Source & Sentiment Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Source */}
            <div className="space-y-2">
              <Label htmlFor="source">Source *</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => handleChange('source', value as InsightSource)}
              >
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSIGHT_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {sourceLabels[source]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sentiment */}
            <div className="space-y-2">
              <Label htmlFor="sentiment">Sentiment</Label>
              <Select
                value={formData.sentiment}
                onValueChange={(value) => handleChange('sentiment', value as InsightSentiment)}
              >
                <SelectTrigger id="sentiment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSIGHT_SENTIMENTS.map((sentiment) => (
                    <SelectItem key={sentiment} value={sentiment}>
                      {sentimentLabels[sentiment]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Source URL & Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source_url">Source URL</Label>
              <Input
                id="source_url"
                type="url"
                placeholder="https://..."
                value={formData.source_url}
                onChange={(e) => handleChange('source_url', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_date">Source Date</Label>
              <Input
                id="source_date"
                type="date"
                value={formData.source_date}
                onChange={(e) => handleChange('source_date', e.target.value)}
              />
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Customer Information (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Name</Label>
                <Input
                  id="customer_name"
                  placeholder="John Doe"
                  value={formData.customer_name}
                  onChange={(e) => handleChange('customer_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.customer_email}
                  onChange={(e) => handleChange('customer_email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_company">Company</Label>
                <Input
                  id="customer_company"
                  placeholder="Acme Inc."
                  value={formData.customer_company}
                  onChange={(e) => handleChange('customer_company', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_segment">Segment</Label>
                <Input
                  id="customer_segment"
                  placeholder="Enterprise, SMB, etc."
                  value={formData.customer_segment}
                  onChange={(e) => handleChange('customer_segment', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Impact Score */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Impact Score</Label>
              <span className="text-sm font-medium">{formData.impact_score}/10</span>
            </div>
            <Slider
              value={[formData.impact_score]}
              onValueChange={([value]) => handleChange('impact_score', value)}
              min={0}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How impactful is addressing this insight? (0 = low, 10 = critical)
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
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map((tag) => (
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !formData.title.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
                ? 'Update Insight'
                : 'Create Insight'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
