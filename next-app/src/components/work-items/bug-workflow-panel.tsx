'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bug,
  CheckCircle2,
  FileSearch,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import {
  type BugPhase,
  type BugTriageData,
  type BugMetadata,
  getBugPhaseConfig,
  canTransitionTo,
  getNextPhase,
  getPreviousPhase,
  isTerminalPhase,
  parseBugMetadata,
  canAdvancePhase,
} from '@/lib/bug/workflow'
import { BugPhaseStepper } from './bug-phase-stepper'
import { BugTriageForm, BugTriageSummary } from './bug-triage-form'

export interface BugWorkflowPanelProps {
  workItemId: string
  currentPhase: BugPhase
  metadata?: unknown
  reviewEnabled?: boolean
  reviewStatus?: string | null
  onPhaseChange: (newPhase: BugPhase) => Promise<void>
  onMetadataUpdate: (metadata: BugMetadata) => Promise<void>
  disabled?: boolean
  className?: string
}

export function BugWorkflowPanel({
  workItemId,
  currentPhase,
  metadata,
  reviewEnabled,
  reviewStatus,
  onPhaseChange,
  onMetadataUpdate,
  disabled = false,
  className,
}: BugWorkflowPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [localMetadata, setLocalMetadata] = useState<BugMetadata>(
    parseBugMetadata(metadata)
  )

  const phaseConfig = getBugPhaseConfig(currentPhase)
  const nextPhase = getNextPhase(currentPhase)
  const prevPhase = getPreviousPhase(currentPhase)
  const isTerminal = isTerminalPhase(currentPhase)

  const { canAdvance, blockers } = canAdvancePhase(
    currentPhase,
    localMetadata,
    reviewEnabled,
    reviewStatus
  )

  const handleTriageChange = async (triage: Partial<BugTriageData>) => {
    const newMetadata: BugMetadata = {
      ...localMetadata,
      triage: {
        ...localMetadata.triage,
        ...triage,
      } as BugTriageData,
    }
    setLocalMetadata(newMetadata)
    // Debounced save could be added here
  }

  const handleSaveAndAdvance = async () => {
    if (!nextPhase || !canAdvance) return

    setIsUpdating(true)
    try {
      // Save metadata first
      await onMetadataUpdate(localMetadata)
      // Then advance phase
      await onPhaseChange(nextPhase)
    } catch (error) {
      console.error('Failed to advance phase:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleGoBack = async () => {
    if (!prevPhase) return

    setIsUpdating(true)
    try {
      await onPhaseChange(prevPhase)
    } catch (error) {
      console.error('Failed to go back:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleInvestigationUpdate = (updates: Partial<BugMetadata['investigation']>) => {
    const newMetadata: BugMetadata = {
      ...localMetadata,
      investigation: {
        ...localMetadata.investigation,
        ...updates,
      },
    }
    setLocalMetadata(newMetadata)
  }

  const handleFixUpdate = (updates: Partial<BugMetadata['fix']>) => {
    const newMetadata: BugMetadata = {
      ...localMetadata,
      fix: {
        ...localMetadata.fix,
        ...updates,
      },
    }
    setLocalMetadata(newMetadata)
  }

  return (
    <Card className={cn('border-red-200 dark:border-red-900', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg">Bug Workflow</CardTitle>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5"
            style={{
              borderColor: phaseConfig.color,
              color: phaseConfig.color,
            }}
          >
            {phaseConfig.emoji} {phaseConfig.name}
          </Badge>
        </div>
        <CardDescription>{phaseConfig.tagline}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Phase Stepper */}
        <BugPhaseStepper
          currentPhase={currentPhase}
          reviewEnabled={reviewEnabled}
          reviewStatus={reviewStatus}
          disabled={disabled || isUpdating}
        />

        <Separator />

        {/* Phase-Specific Content */}
        {currentPhase === 'triage' && (
          <BugTriageForm
            triage={localMetadata.triage}
            onTriageChange={handleTriageChange}
            onStartInvestigation={handleSaveAndAdvance}
            disabled={disabled || isUpdating}
          />
        )}

        {currentPhase === 'investigating' && (
          <div className="space-y-4">
            {/* Triage Summary */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Triage Summary
              </div>
              <BugTriageSummary triage={localMetadata.triage} />
            </div>

            {/* Investigation Form */}
            <div className="space-y-2">
              <Label htmlFor="rootCause" className="text-sm font-medium">
                Root Cause Analysis
              </Label>
              <Textarea
                id="rootCause"
                placeholder="Describe the root cause of the bug..."
                value={localMetadata.investigation?.rootCause ?? ''}
                onChange={(e) => handleInvestigationUpdate({ rootCause: e.target.value })}
                disabled={disabled || isUpdating}
                className="min-h-[100px] resize-y"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                disabled={disabled || isUpdating}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Triage
              </Button>
              <Button
                onClick={handleSaveAndAdvance}
                disabled={disabled || isUpdating || !canAdvance}
                className="gap-2"
              >
                Start Fixing
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {currentPhase === 'fixing' && (
          <div className="space-y-4">
            {/* Investigation Summary */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileSearch className="h-4 w-4 text-blue-500" />
                Root Cause
              </div>
              <p className="text-sm text-muted-foreground">
                {localMetadata.investigation?.rootCause || 'Not documented'}
              </p>
            </div>

            {/* Fix Form */}
            <div className="space-y-2">
              <Label htmlFor="solution" className="text-sm font-medium">
                Fix Solution
              </Label>
              <Textarea
                id="solution"
                placeholder="Describe the fix implementation..."
                value={localMetadata.fix?.solution ?? ''}
                onChange={(e) => handleFixUpdate({ solution: e.target.value })}
                disabled={disabled || isUpdating}
                className="min-h-[100px] resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prLink" className="text-sm font-medium">
                PR Link (Optional)
              </Label>
              <Textarea
                id="prLink"
                placeholder="https://github.com/..."
                value={localMetadata.fix?.prLink ?? ''}
                onChange={(e) => handleFixUpdate({ prLink: e.target.value })}
                disabled={disabled || isUpdating}
                className="min-h-[60px] resize-y"
              />
            </div>

            {/* Review Status */}
            {reviewEnabled && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Review Required</span>
                  <Badge
                    variant={reviewStatus === 'approved' ? 'default' : 'secondary'}
                    className={cn(
                      reviewStatus === 'approved' && 'bg-green-500',
                      reviewStatus === 'pending' && 'bg-amber-500',
                      reviewStatus === 'rejected' && 'bg-red-500'
                    )}
                  >
                    {reviewStatus || 'Not Requested'}
                  </Badge>
                </div>
                {reviewStatus !== 'approved' && (
                  <p className="text-xs text-muted-foreground">
                    Review must be approved before marking as verified
                  </p>
                )}
              </div>
            )}

            {/* Blockers */}
            {blockers.length > 0 && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  Cannot verify yet
                </div>
                <ul className="mt-2 space-y-1 text-sm text-amber-600 dark:text-amber-500">
                  {blockers.map((blocker, i) => (
                    <li key={i}>• {blocker}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                disabled={disabled || isUpdating}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Investigation
              </Button>
              <Button
                onClick={handleSaveAndAdvance}
                disabled={disabled || isUpdating || !canAdvance}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <ShieldCheck className="h-4 w-4" />
                Mark as Verified
              </Button>
            </div>
          </div>
        )}

        {currentPhase === 'verified' && (
          <div className="space-y-4">
            {/* Resolution Summary */}
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Bug Resolved</span>
              </div>

              <div className="space-y-2 text-sm">
                {localMetadata.triage?.severity && (
                  <div>
                    <strong>Severity:</strong>{' '}
                    <span className="capitalize">{localMetadata.triage.severity}</span>
                  </div>
                )}
                {localMetadata.investigation?.rootCause && (
                  <div>
                    <strong>Root Cause:</strong>{' '}
                    {localMetadata.investigation.rootCause}
                  </div>
                )}
                {localMetadata.fix?.solution && (
                  <div>
                    <strong>Solution:</strong>{' '}
                    {localMetadata.fix.solution}
                  </div>
                )}
                {localMetadata.fix?.prLink && (
                  <div>
                    <strong>PR:</strong>{' '}
                    <a
                      href={localMetadata.fix.prLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {localMetadata.fix.prLink}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              This bug has been verified and closed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
