'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import {
  usePhaseReadiness,
  wasBannerDismissed,
} from '@/hooks/use-phase-readiness'
import { getWorkItemSchema } from '@/lib/schemas/work-item-form-schema'
import { PhaseAwareFormFields } from './phase-aware-form-fields'
import { PhaseContextBadge } from './phase-context-badge'
import { PhaseUpgradeBanner } from './phase-upgrade-banner'
import { WorkspacePhase, WorkItemType } from '@/lib/constants/work-item-types'
import type { WorkItemForReadiness } from '@/lib/phase/readiness-calculator'
import { Loader2, AlertCircle, GitBranch } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { VersionHistory } from './version-history'

interface EditWorkItemDialogProps {
  workItemId: string
  workspaceId: string
  phase?: WorkspacePhase  // Optional - defaults to 'launch' (all fields visible)
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/**
 * Edit Work Item Dialog
 *
 * Production-ready dialog for editing existing work items with:
 * - Phase-aware field visibility and locking
 * - Real-time data loading from Supabase
 * - Form validation using Zod schemas
 * - Optimistic updates with error handling
 * - Loading states and error boundaries
 *
 * Features:
 * - Loads existing data on mount
 * - Validates using phase-specific schema
 * - Shows phase context badge
 * - Handles loading/error states gracefully
 * - Updates via PATCH API endpoint
 * - Refreshes parent on success
 *
 * @example
 * ```tsx
 * <EditWorkItemDialog
 *   workItemId="work_item_123"
 *   workspaceId="workspace_456"
 *   phase="design"
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSuccess={() => console.log('Updated!')}
 * />
 * ```
 */
// Updated 2025-12-13: 'complete' → 'launch', 'planning' → 'design' in 4-phase system
export function EditWorkItemDialog({
  workItemId,
  workspaceId,
  phase = 'launch',  // Default to 'launch' - all fields visible, none locked
  open,
  onOpenChange,
  onSuccess,
}: EditWorkItemDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadedWorkItem, setLoadedWorkItem] = useState<WorkItemForReadiness | null>(null)
  const [timelineItemsCount, setTimelineItemsCount] = useState(0)

  // Enhancement state
  const [isEnhancement, setIsEnhancement] = useState(false)
  const [enhancesWorkItemId, setEnhancesWorkItemId] = useState<string | null>(null)
  const [version, setVersion] = useState(1)
  const [workItemType, setWorkItemType] = useState<WorkItemType>('feature')
  const [workItemPhase, setWorkItemPhase] = useState<string | null>(null)

  // Get phase-appropriate schema
  const schema = getWorkItemSchema(phase)

  // Calculate phase readiness for the loaded work item
  const { readiness, guidance, showBanner } = usePhaseReadiness({
    workItem: loadedWorkItem || {
      id: workItemId,
      name: '',
      purpose: null,
      type: 'concept',
      phase: phase,
    },
    timelineItemsCount,
  })

  // Determine if banner should be shown (readiness >= 80% and not dismissed)
  const shouldShowBanner =
    loadedWorkItem &&
    showBanner &&
    !wasBannerDismissed(workItemId, readiness.currentPhase as WorkspacePhase, readiness.readinessPercent)

  // Initialize form with default values
  // Note: Using 'any' for form type because different phases have different fields
  // The schema validation will ensure only valid fields are submitted
  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      purpose: '',
      type: 'concept' as WorkItemType,
      tags: [],
      // Planning fields
      target_release: '',
      acceptance_criteria: '',
      business_value: '',
      customer_impact: '',
      strategic_alignment: '',
      estimated_hours: undefined,
      priority: 'medium',
      stakeholders: [],
      // Execution fields
      actual_start_date: '',
      actual_end_date: '',
      actual_hours: undefined,
      progress_percent: undefined,
      blockers: [],
    },
  })

  /**
   * Load work item data when dialog opens
   * Handles errors gracefully and shows user feedback
   */
  useEffect(() => {
    if (open && workItemId) {
      loadWorkItem()
    }
  }, [open, workItemId])

  /**
   * Fetch work item from Supabase and populate form
   */
  async function loadWorkItem() {
    try {
      setIsLoadingData(true)
      setLoadError(null)

      const supabase = createClient()

      // Fetch work item
      const { data, error } = await supabase
        .from('work_items')
        .select('*')
        .eq('id', workItemId)
        .single()

      if (error) {
        console.error('Error loading work item:', error)
        throw new Error('Failed to load work item')
      }

      if (!data) {
        throw new Error('Work item not found')
      }

      // Fetch timeline items count for readiness calculation
      const { count: timelineCount } = await supabase
        .from('timeline_items')
        .select('*', { count: 'exact', head: true })
        .eq('work_item_id', workItemId)

      setTimelineItemsCount(timelineCount || 0)

      // Store loaded work item for readiness calculation
      setLoadedWorkItem({
        id: data.id,
        name: data.name || '',
        purpose: data.purpose,
        type: data.type,
        phase: data.phase || phase,
        target_release: data.target_release,
        acceptance_criteria: data.acceptance_criteria,
        business_value: data.business_value,
        customer_impact: data.customer_impact,
        strategic_alignment: data.strategic_alignment,
        estimated_hours: data.estimated_hours,
        priority: data.priority,
        actual_start_date: data.actual_start_date,
        actual_end_date: data.actual_end_date,
        actual_hours: data.actual_hours,
        progress_percent: data.progress_percent,
      })

      // Populate form with loaded data
      // Handle null values by converting to empty strings/undefined
      form.reset({
        name: data.name || '',
        purpose: data.purpose || '',
        type: data.type,
        tags: [], // Tags loaded separately via join table
        // Planning fields
        target_release: data.target_release || '',
        acceptance_criteria: data.acceptance_criteria || '',
        business_value: data.business_value || '',
        customer_impact: data.customer_impact || '',
        strategic_alignment: data.strategic_alignment || '',
        estimated_hours: data.estimated_hours ?? undefined,
        priority: data.priority || 'medium',
        stakeholders: [], // Stakeholders loaded separately
        // Execution fields
        actual_start_date: data.actual_start_date || '',
        actual_end_date: data.actual_end_date || '',
        actual_hours: data.actual_hours ?? undefined,
        progress_percent: data.progress_percent ?? undefined,
        blockers: [], // Blockers loaded separately
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load work item'
      console.error('Error in loadWorkItem:', error)
      setLoadError(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  /**
   * Submit form and update work item via API
   * Uses PATCH endpoint with phase permission validation
   */
  async function onSubmit(values: any) {
    try {
      setIsLoading(true)

      // Call PATCH API endpoint
      const response = await fetch(`/api/work-items/${workItemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          purpose: values.purpose,
          type: values.type,
          // Planning fields (only if visible in phase)
          target_release: values.target_release || null,
          acceptance_criteria: values.acceptance_criteria || null,
          business_value: values.business_value || null,
          customer_impact: values.customer_impact || null,
          strategic_alignment: values.strategic_alignment || null,
          estimated_hours: values.estimated_hours ?? null,
          priority: values.priority || null,
          // Execution fields (only if visible in phase)
          actual_start_date: values.actual_start_date || null,
          actual_end_date: values.actual_end_date || null,
          actual_hours: values.actual_hours ?? null,
          progress_percent: values.progress_percent ?? null,
          // Enhancement tracking fields
          is_enhancement: isEnhancement,
          enhances_work_item_id: enhancesWorkItemId,
          version: version,
          version_notes: values.version_notes || null,
          // Note: Tags, stakeholders, blockers handled separately via junction tables
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update work item')
      }

      toast({
        title: 'Success',
        description: 'Work item updated successfully',
      })

      // Refresh parent data
      router.refresh()

      // Close dialog
      onOpenChange(false)

      // Call success callback
      onSuccess?.()
    } catch (error: any) {
      console.error('Error updating work item:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update work item',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle dialog close
   * Reset form and clear errors
   */
  function handleClose() {
    if (!isLoading) {
      form.reset()
      setLoadError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Work Item</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <PhaseContextBadge phase={phase} />
            {isEnhancement && (
              <Badge variant="outline" className="gap-1">
                <GitBranch className="h-3 w-3" />
                Enhancement v{version}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Phase Upgrade Banner */}
        {shouldShowBanner && (
          <PhaseUpgradeBanner
            workItemId={workItemId}
            readiness={readiness}
            guidance={guidance}
            onUpgradeSuccess={() => {
              router.refresh()
              onSuccess?.()
            }}
            className="mb-4"
          />
        )}

        {/* Loading State */}
        {isLoadingData && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Loading work item...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoadingData && loadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {loadError}
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={loadWorkItem}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Form State */}
        {!isLoadingData && !loadError && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <PhaseAwareFormFields
                form={form}
                phase={phase}
                isEdit={true}
              />

              {/* Version History - only show for features (including enhancements which are flagged features) */}
              {workItemType === 'feature' && (
                <VersionHistory
                  workItemId={workItemId}
                  currentVersion={version}
                  enhancesWorkItemId={enhancesWorkItemId}
                  type={workItemType}
                  phase={workItemPhase ?? undefined}
                  teamId={workspaceId}
                />
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Work Item
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
