'use client'

/**
 * SmartWorkItemForm Component
 *
 * A mode-aware work item creation form with progressive disclosure.
 * Automatically adapts field visibility and defaults based on workspace mode.
 */

import { useState, useEffect, useMemo } from 'react'
import {
  Sparkles,
  Bug,
  Zap,
  Lightbulb,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProgressiveForm, useProgressiveFormContext } from '@/components/forms/progressive-form'
import { ProgressiveFieldGroup } from '@/components/forms/progressive-field-group'
import { WorkspaceMode, WORKSPACE_MODE_CONFIG } from '@/lib/types/workspace-mode'
import {
  getModeDefaultWorkItemType,
  getModeSuggestedActions,
  WorkItemType,
  WorkItemField,
} from '@/lib/workspace-modes/mode-config'

// ============================================================================
// TYPES
// ============================================================================

export interface SmartWorkItemFormData {
  name: string
  type: WorkItemType
  purpose: string
  priority?: string
  department?: string
  tags?: string[]
  owner?: string
  target_release?: string
  estimated_hours?: number
  customer_impact?: string
  business_value?: string
  blockers?: string
}

interface SmartWorkItemFormProps {
  /** Current workspace mode */
  mode: WorkspaceMode
  /** Workspace ID for context */
  workspaceId: string
  /** Team ID for context */
  teamId: string
  /** User ID for preference persistence */
  userId?: string
  /** Initial form values */
  initialValues?: Partial<SmartWorkItemFormData>
  /** Called when form is submitted */
  onSubmit: (data: SmartWorkItemFormData) => Promise<void>
  /** Called when form is cancelled */
  onCancel?: () => void
  /** Whether form is submitting */
  isSubmitting?: boolean
  /** Custom class name */
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TYPE_CONFIG = {
  concept: {
    icon: Lightbulb,
    label: 'Concept',
    description: 'An unvalidated idea to explore',
    color: 'text-purple-600 bg-purple-50',
  },
  feature: {
    icon: Sparkles,
    label: 'Feature',
    description: 'New functionality to build',
    color: 'text-blue-600 bg-blue-50',
  },
  bug: {
    icon: Bug,
    label: 'Bug',
    description: 'Something that needs fixing',
    color: 'text-red-600 bg-red-50',
  },
}

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'text-red-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'low', label: 'Low', color: 'text-green-600' },
]

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TypeSelector({
  value,
  onChange,
  mode,
}: {
  value: WorkItemType
  onChange: (type: WorkItemType) => void
  mode: WorkspaceMode
}) {
  const suggestedType = getModeDefaultWorkItemType(mode)

  return (
    <div className="space-y-2">
      <Label>Type</Label>
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(TYPE_CONFIG) as [WorkItemType, typeof TYPE_CONFIG.concept][]).map(
          ([type, config]) => {
            const Icon = config.icon
            const isSelected = value === type
            const isSuggested = type === suggestedType

            return (
              <button
                key={type}
                type="button"
                onClick={() => onChange(type)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                )}
              >
                <div
                  className={cn(
                    'p-1.5 rounded-md',
                    isSelected ? config.color : 'bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{config.label}</span>
                    {isSuggested && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">
                        Suggested
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {config.description}
                  </p>
                </div>
              </button>
            )
          }
        )}
      </div>
    </div>
  )
}

function ModeHint({ mode }: { mode: WorkspaceMode }) {
  const config = WORKSPACE_MODE_CONFIG[mode]
  const suggestedType = getModeDefaultWorkItemType(mode)
  const typeConfig = TYPE_CONFIG[suggestedType]

  return (
    <Alert className="border-none bg-muted/50">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-sm">
        <span className="font-medium">{config.name} mode</span> suggests{' '}
        <span className={cn('font-medium', typeConfig.color.split(' ')[0])}>
          {typeConfig.label}
        </span>{' '}
        work items. Focus: {config.emphasis}
      </AlertDescription>
    </Alert>
  )
}

// ============================================================================
// FORM FIELDS
// ============================================================================

function FormFields() {
  const { mode, isFieldVisible, isExpanded } = useProgressiveFormContext()

  return (
    <>
      {/* Priority Field - shown if visible */}
      {isFieldVisible('priority') && (
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority">
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className={option.color}>{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Department Field - shown if visible */}
      {isFieldVisible('department') && (
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select name="department">
            <SelectTrigger id="department">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Target Release - shown if visible */}
      {isFieldVisible('target_release') && (
        <div className="space-y-2">
          <Label htmlFor="target_release">Target Release</Label>
          <Input
            id="target_release"
            name="target_release"
            placeholder="e.g., v2.0, Q1 2025"
          />
        </div>
      )}

      {/* Estimated Hours - shown if visible */}
      {isFieldVisible('estimated_hours') && (
        <div className="space-y-2">
          <Label htmlFor="estimated_hours">Estimated Hours</Label>
          <Input
            id="estimated_hours"
            name="estimated_hours"
            type="number"
            min="0"
            placeholder="0"
          />
        </div>
      )}

      {/* Customer Impact - shown if visible (especially in Growth mode) */}
      {isFieldVisible('customer_impact') && (
        <div className="space-y-2">
          <Label htmlFor="customer_impact">Customer Impact</Label>
          <Textarea
            id="customer_impact"
            name="customer_impact"
            placeholder="How will this affect users?"
            rows={2}
          />
        </div>
      )}

      {/* Business Value - shown if visible */}
      {isFieldVisible('business_value') && (
        <div className="space-y-2">
          <Label htmlFor="business_value">Business Value</Label>
          <Textarea
            id="business_value"
            name="business_value"
            placeholder="What value does this provide?"
            rows={2}
          />
        </div>
      )}

      {/* Blockers - shown if visible (especially in Launch/Maintenance modes) */}
      {isFieldVisible('blockers') && (
        <div className="space-y-2">
          <Label htmlFor="blockers">Blockers</Label>
          <Textarea
            id="blockers"
            name="blockers"
            placeholder="What might block this work?"
            rows={2}
          />
        </div>
      )}
    </>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * SmartWorkItemForm - A mode-aware work item creation form
 *
 * @example
 * ```tsx
 * <SmartWorkItemForm
 *   mode={workspace.mode}
 *   workspaceId={workspace.id}
 *   teamId={team.id}
 *   onSubmit={handleCreate}
 *   onCancel={() => setOpen(false)}
 * />
 * ```
 */
export function SmartWorkItemForm({
  mode,
  workspaceId,
  teamId,
  userId,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
}: SmartWorkItemFormProps) {
  // Initialize with mode-specific defaults
  const defaultType = getModeDefaultWorkItemType(mode)

  const [name, setName] = useState(initialValues?.name || '')
  const [type, setType] = useState<WorkItemType>(initialValues?.type || defaultType)
  const [purpose, setPurpose] = useState(initialValues?.purpose || '')
  const [formError, setFormError] = useState<string | null>(null)

  // Reset type when mode changes
  useEffect(() => {
    if (!initialValues?.type) {
      setType(getModeDefaultWorkItemType(mode))
    }
  }, [mode, initialValues?.type])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    // Basic validation
    if (!name.trim()) {
      setFormError('Name is required')
      return
    }

    if (!purpose.trim()) {
      setFormError('Purpose is required')
      return
    }

    // Collect form data
    const formData = new FormData(e.currentTarget)
    const data: SmartWorkItemFormData = {
      name: name.trim(),
      type,
      purpose: purpose.trim(),
      priority: formData.get('priority') as string | undefined,
      department: formData.get('department') as string | undefined,
      target_release: formData.get('target_release') as string | undefined,
      estimated_hours: formData.get('estimated_hours')
        ? Number(formData.get('estimated_hours'))
        : undefined,
      customer_impact: formData.get('customer_impact') as string | undefined,
      business_value: formData.get('business_value') as string | undefined,
      blockers: formData.get('blockers') as string | undefined,
    }

    try {
      await onSubmit(data)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create work item')
    }
  }

  return (
    <ProgressiveForm
      formId={`smart-work-item-${workspaceId}`}
      mode={mode}
      userId={userId}
      onSubmit={handleSubmit}
      className={className}
    >
      {/* Mode Hint */}
      <ModeHint mode={mode} />

      {/* Essential Fields */}
      <ProgressiveFieldGroup group="essential">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What are you working on?"
            autoFocus
          />
        </div>

        {/* Type Selector */}
        <TypeSelector value={type} onChange={setType} mode={mode} />

        {/* Purpose */}
        <div className="space-y-2">
          <Label htmlFor="purpose">Purpose *</Label>
          <Textarea
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Why is this important? What problem does it solve?"
            rows={3}
          />
        </div>
      </ProgressiveFieldGroup>

      {/* Expanded Fields */}
      <ProgressiveFieldGroup
        group="expanded"
        label="Add more details"
        showDivider
      >
        <FormFields />
      </ProgressiveFieldGroup>

      {/* Error Display */}
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Work Item'}
        </Button>
      </div>
    </ProgressiveForm>
  )
}

export default SmartWorkItemForm
