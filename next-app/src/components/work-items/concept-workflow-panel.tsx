'use client'

/**
 * Concept Workflow Panel
 *
 * Main orchestrator component for concept lifecycle management.
 * Combines phase stepper, guidance, and action buttons.
 *
 * Features:
 * - Visual phase stepper
 * - Phase-specific guidance
 * - Action buttons (Advance, Validate, Reject)
 * - Auto-trigger promotion dialog on validation
 * - Rejection workflow with reason capture
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Context and components
import { useWorkItemDetailContext } from '@/components/work-item-detail/shared/detail-context'
import { ConceptPhaseStepper } from './concept-phase-stepper'
import { ConceptPromotionDialog } from './concept-promotion-dialog'
import { ConceptRejectionDialog } from './concept-rejection-dialog'

// Workflow logic
import {
  canTransitionConcept,
  getConceptPhaseConfig,
  getConceptColors,
  type ConceptPhase,
} from '@/lib/concept/workflow'

// =============================================================================
// COMPONENT
// =============================================================================

export function ConceptWorkflowPanel() {
  const { workItem, updateWorkItem } = useWorkItemDetailContext()
  const { toast } = useToast()
  const router = useRouter()

  const [showPromotionDialog, setShowPromotionDialog] = useState(false)
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Track previous phase to detect validation
  const prevPhaseRef = useRef(workItem.status as ConceptPhase)

  // Auto-show promotion dialog when validated
  useEffect(() => {
    const currentPhase = workItem.status as ConceptPhase
    if (prevPhaseRef.current !== 'validated' && currentPhase === 'validated') {
      setShowPromotionDialog(true)
    }
    prevPhaseRef.current = currentPhase
  }, [workItem.status])

  // Only show for concepts
  if (!workItem || workItem.type !== 'concept') {
    return null
  }

  const currentPhase = workItem.status as ConceptPhase
  const phaseConfig = getConceptPhaseConfig(currentPhase)
  if (!phaseConfig) return null

  const Icon = phaseConfig.icon
  const colors = getConceptColors(currentPhase)

  // Handle phase transition
  const handlePhaseTransition = async (targetPhase: ConceptPhase) => {
    if (!canTransitionConcept(currentPhase, targetPhase)) {
      toast({
        title: 'Invalid transition',
        description: `Cannot move from ${currentPhase} to ${targetPhase}`,
        variant: 'destructive',
      })
      return
    }

    setIsTransitioning(true)
    try {
      const response = await fetch(`/api/work-items/${workItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetPhase }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update phase')
      }

      // Optimistic update
      updateWorkItem({ status: targetPhase })

      toast({
        title: 'Phase updated',
        description: `Concept moved to ${phaseConfig.actions.primary?.label || targetPhase}`,
      })

      // Show promotion dialog if validated
      if (targetPhase === 'validated') {
        setShowPromotionDialog(true)
      }

      // Refresh to get latest data
      router.refresh()
    } catch (error) {
      console.error('Phase transition error:', error)
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Could not update concept phase',
        variant: 'destructive',
      })
    } finally {
      setIsTransitioning(false)
    }
  }

  // Handle rejection
  const handleRejection = async (reason: string, archive: boolean) => {
    setIsTransitioning(true)
    try {
      const response = await fetch(`/api/work-items/${workItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: reason,
          archived: archive,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject concept')
      }

      // Optimistic update
      updateWorkItem({
        status: 'rejected',
        // @ts-expect-error - rejection_reason not in WorkItemData type yet
        rejection_reason: reason,
        // @ts-expect-error - archived not in WorkItemData type yet
        archived: archive,
      })

      toast({
        title: 'Concept rejected',
        description: archive ? 'Concept archived' : 'Rejection recorded',
      })

      // Close dialog
      setShowRejectionDialog(false)

      // Refresh to get latest data
      router.refresh()
    } catch (error) {
      console.error('Rejection error:', error)
      toast({
        title: 'Rejection failed',
        description: error instanceof Error ? error.message : 'Could not reject concept',
        variant: 'destructive',
      })
    } finally {
      setIsTransitioning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Phase Stepper */}
      <Card>
        <CardHeader>
          <CardTitle>Concept Lifecycle</CardTitle>
          <CardDescription>
            Track progress through ideation, research, and validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConceptPhaseStepper currentPhase={currentPhase} />
        </CardContent>
      </Card>

      {/* Current Phase Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', colors.bg)}>
                <Icon className={cn('w-5 h-5', colors.text)} />
              </div>
              <div>
                <CardTitle>{phaseConfig.label}</CardTitle>
                <CardDescription>{phaseConfig.description}</CardDescription>
              </div>
            </div>
            <Badge
              variant={phaseConfig.isTerminal ? 'outline' : 'default'}
              className={cn(
                phaseConfig.isTerminal && 'border-2',
                colors.border,
                colors.text
              )}
            >
              {phaseConfig.isTerminal ? 'Terminal' : 'Active'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Guidance */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Phase Guidance
            </h4>
            <ul className="space-y-1.5">
              {phaseConfig.guidance.map((item, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Rejection Reason (if rejected) */}
          {currentPhase === 'rejected' && (workItem as any).rejection_reason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Rejection Reason:</strong> {(workItem as any).rejection_reason}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {!phaseConfig.isTerminal && (
            <div className="flex gap-3 pt-4 border-t">
              {/* Primary Action */}
              {phaseConfig.actions.primary && (
                <Button
                  onClick={() => {
                    const action = phaseConfig.actions.primary!
                    if (action.requiresConfirmation) {
                      if (confirm(`Are you sure you want to ${action.label.toLowerCase()}?`)) {
                        handlePhaseTransition(action.targetPhase)
                      }
                    } else {
                      handlePhaseTransition(action.targetPhase)
                    }
                  }}
                  disabled={isTransitioning}
                  className="flex-1"
                >
                  {phaseConfig.actions.primary.label}
                </Button>
              )}

              {/* Secondary Action (Reject) */}
              {phaseConfig.actions.secondary && (
                <Button
                  variant="outline"
                  onClick={() => setShowRejectionDialog(true)}
                  disabled={isTransitioning}
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                >
                  {phaseConfig.actions.secondary.label}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ConceptPromotionDialog
        concept={workItem as any}
        open={showPromotionDialog}
        onOpenChange={setShowPromotionDialog}
        onPromote={(featureId) => {
          // Navigate to new feature
          router.push(`/workspaces/${workItem.workspace_id}/work-items/${featureId}`)
        }}
      />

      <ConceptRejectionDialog
        open={showRejectionDialog}
        onOpenChange={setShowRejectionDialog}
        onConfirm={handleRejection}
        conceptName={workItem.title}
      />
    </div>
  )
}
