'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
} from 'lucide-react'
import {
  type BugTriageData,
  type BugSeverity,
  BUG_SEVERITIES,
  SEVERITY_CONFIG,
  isTriageComplete,
  getTriageCompletionPercent,
  getMissingTriageFields,
} from '@/lib/bug/workflow'

export interface BugTriageFormProps {
  triage?: Partial<BugTriageData>
  onTriageChange: (triage: Partial<BugTriageData>) => void
  onStartInvestigation?: () => void
  disabled?: boolean
  className?: string
}

export function BugTriageForm({
  triage,
  onTriageChange,
  onStartInvestigation,
  disabled = false,
  className,
}: BugTriageFormProps) {
  const [localTriage, setLocalTriage] = useState<Partial<BugTriageData>>(
    triage ?? { reproducible: true }
  )

  // Sync with external triage data
  useEffect(() => {
    if (triage) {
      setLocalTriage(triage)
    }
  }, [triage])

  const handleChange = (updates: Partial<BugTriageData>) => {
    const newTriage = { ...localTriage, ...updates }
    setLocalTriage(newTriage)
    onTriageChange(newTriage)
  }

  const completionPercent = getTriageCompletionPercent(localTriage as BugTriageData)
  const canProceed = isTriageComplete(localTriage as BugTriageData)
  const missingFields = getMissingTriageFields(localTriage as BugTriageData)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Triage Progress</span>
          <span className="font-medium">{completionPercent}%</span>
        </div>
        <Progress value={completionPercent} className="h-2" />
        {missingFields.length > 0 && (
          <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Missing: {missingFields.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Severity Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Severity <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {BUG_SEVERITIES.map((severity) => {
            const config = SEVERITY_CONFIG[severity]
            const isSelected = localTriage.severity === severity

            return (
              <button
                key={severity}
                type="button"
                disabled={disabled}
                onClick={() => handleChange({ severity })}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
                  'hover:border-gray-400 dark:hover:border-gray-500',
                  isSelected && 'ring-2 ring-offset-1',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                style={isSelected ? {
                  borderColor: config.color,
                  ['--tw-ring-color' as string]: config.color,
                } : undefined}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="font-medium text-sm">{config.label}</span>
                </div>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {config.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Reproducible Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="reproducible" className="text-sm font-medium">
            Reproducible <span className="text-red-500">*</span>
          </Label>
          <Switch
            id="reproducible"
            checked={localTriage.reproducible ?? true}
            onCheckedChange={(checked) => handleChange({ reproducible: checked })}
            disabled={disabled}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Can you consistently reproduce this bug?
        </p>
      </div>

      {/* Steps to Reproduce (shown if reproducible) */}
      {localTriage.reproducible && (
        <div className="space-y-2">
          <Label htmlFor="steps" className="text-sm font-medium">
            Steps to Reproduce <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="steps"
            placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
            value={localTriage.stepsToReproduce ?? ''}
            onChange={(e) => handleChange({ stepsToReproduce: e.target.value })}
            disabled={disabled}
            className="min-h-[100px] resize-y"
          />
        </div>
      )}

      {/* Expected vs Actual */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expected" className="text-sm font-medium">
            Expected Behavior
          </Label>
          <Textarea
            id="expected"
            placeholder="What should happen?"
            value={localTriage.expectedBehavior ?? ''}
            onChange={(e) => handleChange({ expectedBehavior: e.target.value })}
            disabled={disabled}
            className="min-h-[80px] resize-y"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="actual" className="text-sm font-medium">
            Actual Behavior
          </Label>
          <Textarea
            id="actual"
            placeholder="What actually happens?"
            value={localTriage.actualBehavior ?? ''}
            onChange={(e) => handleChange({ actualBehavior: e.target.value })}
            disabled={disabled}
            className="min-h-[80px] resize-y"
          />
        </div>
      </div>

      {/* Action Button */}
      {onStartInvestigation && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            {canProceed ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">
                  Triage complete
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">
                  Complete required fields
                </span>
              </>
            )}
          </div>
          <Button
            onClick={onStartInvestigation}
            disabled={disabled || !canProceed}
            className="gap-2"
          >
            Start Investigation
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Compact triage summary for display in other contexts
 */
export function BugTriageSummary({
  triage,
  className,
}: {
  triage?: BugTriageData
  className?: string
}) {
  if (!triage) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No triage data
      </div>
    )
  }

  const severityConfig = triage.severity ? SEVERITY_CONFIG[triage.severity] : null

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {severityConfig && (
          <Badge
            variant="outline"
            className="gap-1"
            style={{
              borderColor: severityConfig.color,
              color: severityConfig.color,
            }}
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: severityConfig.color }}
            />
            {severityConfig.label}
          </Badge>
        )}
        <Badge variant={triage.reproducible ? 'default' : 'secondary'}>
          {triage.reproducible ? 'Reproducible' : 'Not Reproducible'}
        </Badge>
      </div>

      {triage.stepsToReproduce && (
        <div className="text-xs text-muted-foreground">
          <strong>Steps:</strong>{' '}
          {triage.stepsToReproduce.split('\n')[0]}
          {triage.stepsToReproduce.includes('\n') && '...'}
        </div>
      )}
    </div>
  )
}
