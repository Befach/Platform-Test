'use client'

/**
 * Concept Promotion Dialog
 *
 * Dialog for promoting a validated concept to a feature work item.
 * Shows when a concept reaches the 'validated' phase and offers two paths:
 * 1. Promote to Feature - Creates a new feature linked to the concept
 * 2. Keep as Concept - Marks as validated without creating a feature
 *
 * @module components/work-items/concept-promotion-dialog
 */

import { useState, useCallback } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2,
  Lightbulb,
  ArrowRight,
  Rocket,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTypePhaseConfig } from '@/lib/constants/workspace-phases'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Minimal work item interface for concept promotion
 */
export interface ConceptForPromotion {
  id: string
  name: string
  title?: string // Some places use title, others use name
  purpose?: string | null
  description?: string | null
  team_id: string
  workspace_id: string
  phase: string
  type: string
  tags?: string[] | null
}

/**
 * Props for ConceptPromotionDialog
 */
export interface ConceptPromotionDialogProps {
  /** The validated concept to potentially promote */
  concept: ConceptForPromotion | null
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when feature is created from concept */
  onPromote?: (featureId: string) => void
  /** Callback when user chooses to keep as concept */
  onKeepAsConcept?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Dialog component for promoting a validated concept to a feature
 *
 * @example
 * ```tsx
 * <ConceptPromotionDialog
 *   concept={validatedConcept}
 *   open={showPromotionDialog}
 *   onOpenChange={setShowPromotionDialog}
 *   onPromote={(id) => router.push(`/work-items/${id}`)}
 * />
 * ```
 */
export function ConceptPromotionDialog({
  concept,
  open,
  onOpenChange,
  onPromote,
  onKeepAsConcept,
}: ConceptPromotionDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [featureTitle, setFeatureTitle] = useState('')
  const [featureDescription, setFeatureDescription] = useState('')

  // Initialize form when concept changes
  useState(() => {
    if (concept) {
      setFeatureTitle(concept.title || concept.name || '')
      setFeatureDescription(concept.description || concept.purpose || '')
    }
  })

  /**
   * Handle promoting concept to feature
   */
  const handlePromote = useCallback(async () => {
    if (!concept) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'feature',
          phase: 'design',
          name: featureTitle || concept.title || concept.name,
          title: featureTitle || concept.title || concept.name,
          purpose: featureDescription || concept.description || concept.purpose,
          description: featureDescription || concept.description || concept.purpose,
          enhances_work_item_id: concept.id, // Link to original concept
          version: 1,
          workspace_id: concept.workspace_id,
          team_id: concept.team_id,
          tags: concept.tags,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create feature')
      }

      toast({
        title: 'Concept Promoted!',
        description: 'Created new feature from validated concept',
      })

      onOpenChange(false)
      router.refresh()
      onPromote?.(result.id || result.work_item?.id)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not promote concept'
      toast({
        title: 'Promotion Failed',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [
    concept,
    featureTitle,
    featureDescription,
    toast,
    router,
    onOpenChange,
    onPromote,
  ])

  /**
   * Handle keeping concept without promotion
   */
  const handleKeepAsConcept = useCallback(() => {
    onOpenChange(false)
    onKeepAsConcept?.()
    toast({
      title: 'Concept Validated',
      description: 'Concept marked as validated without feature creation',
    })
  }, [onOpenChange, onKeepAsConcept, toast])

  if (!concept) return null

  // Get phase configs for display
  const conceptPhaseConfig = getTypePhaseConfig('concept', 'validated')
  const featurePhaseConfig = getTypePhaseConfig('feature', 'design')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-600" />
            Concept Validated - Ready to Promote?
          </DialogTitle>
          <DialogDescription>
            Your concept has been validated! You can now promote it to a feature
            to begin the design and development process.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Concept Summary */}
          <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-green-600" />
                <span className="font-medium">Validated Concept</span>
              </div>
              {conceptPhaseConfig && (
                <Badge className={cn(conceptPhaseConfig.bgColor, conceptPhaseConfig.textColor)}>
                  {conceptPhaseConfig.emoji} {conceptPhaseConfig.name}
                </Badge>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {concept.title || concept.name}
              </h3>
              {(concept.description || concept.purpose) && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                  {concept.description || concept.purpose}
                </p>
              )}
            </div>
          </div>

          {/* Promotion Arrow */}
          <div className="flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Feature Creation Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-violet-600" />
                <span className="font-medium">New Feature</span>
              </div>
              {featurePhaseConfig && (
                <Badge className={cn(featurePhaseConfig.bgColor, featurePhaseConfig.textColor)}>
                  {featurePhaseConfig.emoji} {featurePhaseConfig.name}
                </Badge>
              )}
            </div>

            {/* Feature Title */}
            <div className="space-y-2">
              <Label htmlFor="feature-title">Feature Title</Label>
              <Input
                id="feature-title"
                placeholder="E.g., User Authentication System"
                value={featureTitle}
                onChange={(e) => setFeatureTitle(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Pre-filled with concept title. Customize if needed.
              </p>
            </div>

            {/* Feature Description */}
            <div className="space-y-2">
              <Label htmlFor="feature-description">Description</Label>
              <Textarea
                id="feature-description"
                placeholder="Describe the feature and its goals..."
                value={featureDescription}
                onChange={(e) => setFeatureDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>What happens next:</strong> A new feature will be created
                in the <strong>Design</strong> phase, linked to this concept. The
                concept will remain as a reference for the research and validation
                that led to this feature.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Keep as Concept option */}
          <Button
            variant="outline"
            onClick={handleKeepAsConcept}
            disabled={isSubmitting}
            className="sm:mr-auto"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Keep as Validated Concept
          </Button>

          {/* Cancel / Promote */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePromote}
              disabled={isSubmitting || !featureTitle.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Rocket className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Creating...' : 'Promote to Feature'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConceptPromotionDialog
