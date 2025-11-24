import { useMemo } from 'react'
import { isFieldVisibleInPhase, isFieldLockedInPhase, WorkspacePhase } from '@/lib/constants/work-item-types'

/**
 * Field group visibility and lock status
 */
export interface FieldGroupStatus {
  /** Whether the field group is visible in the current phase */
  visible: boolean
  /** Whether the field group is locked (read-only) in the current phase */
  locked: boolean
}

/**
 * Return type for usePhaseAwareFields hook
 */
export interface PhaseAwareFieldsResult {
  /** Array of field names visible in the current phase */
  visibleFields: string[]
  /** Array of field names locked (read-only) in the current phase */
  lockedFields: string[]
  /** Visibility and lock status for each field group */
  fieldGroups: {
    basic: FieldGroupStatus
    planning: FieldGroupStatus
    execution: FieldGroupStatus
  }
}

/**
 * Hook for managing phase-aware field visibility and locking
 *
 * Field visibility rules:
 * - **Basic fields**: Always visible, never locked (name, purpose, tags, type)
 * - **Planning fields**: Visible from planning phase onwards, locked from execution onwards
 * - **Execution fields**: Visible from execution phase onwards, never locked
 *
 * @param phase - Current workspace phase
 * @returns Object containing visible fields, locked fields, and field group status
 *
 * @example
 * ```tsx
 * const { visibleFields, lockedFields, fieldGroups } = usePhaseAwareFields('planning')
 *
 * // Check if field is visible
 * const showEstimate = visibleFields.includes('estimated_hours')
 *
 * // Check if field is locked
 * const isEstimateLocked = lockedFields.includes('estimated_hours')
 *
 * // Check if entire group is visible
 * if (fieldGroups.planning.visible) {
 *   // Show planning section
 * }
 * ```
 */
export function usePhaseAwareFields(phase: WorkspacePhase): PhaseAwareFieldsResult {
  return useMemo(() => {
    // Define field groups
    const basicFields = ['name', 'purpose', 'tags', 'type']
    const planningFields = [
      'target_release',
      'acceptance_criteria',
      'business_value',
      'customer_impact',
      'strategic_alignment',
      'estimated_hours',
      'priority',
      'stakeholders',
    ]
    const executionFields = [
      'actual_start_date',
      'actual_end_date',
      'actual_hours',
      'progress_percent',
      'blockers',
    ]

    // Combine all fields
    const allFields = [...basicFields, ...planningFields, ...executionFields]

    // Calculate visibility and locking for each field
    const visibleFields = allFields.filter(field => isFieldVisibleInPhase(field, phase))
    const lockedFields = allFields.filter(field => isFieldLockedInPhase(field, phase))

    // Calculate field group status
    const planningPhasesAndAfter: WorkspacePhase[] = ['planning', 'execution', 'review', 'complete']
    const executionPhasesAndAfter: WorkspacePhase[] = ['execution', 'review', 'complete']

    const fieldGroups: PhaseAwareFieldsResult['fieldGroups'] = {
      basic: {
        visible: true, // Always visible
        locked: false, // Never locked
      },
      planning: {
        visible: planningPhasesAndAfter.includes(phase),
        locked: executionPhasesAndAfter.includes(phase),
      },
      execution: {
        visible: executionPhasesAndAfter.includes(phase),
        locked: false, // Never locked
      },
    }

    return {
      visibleFields,
      lockedFields,
      fieldGroups,
    }
  }, [phase])
}

/**
 * Helper function to check if a specific field is visible
 *
 * @param field - Field name to check
 * @param phase - Current workspace phase
 * @returns True if field is visible in the current phase
 *
 * @example
 * ```tsx
 * if (isFieldVisible('estimated_hours', 'planning')) {
 *   // Show estimated hours field
 * }
 * ```
 */
export function isFieldVisible(field: string, phase: WorkspacePhase): boolean {
  return isFieldVisibleInPhase(field, phase)
}

/**
 * Helper function to check if a specific field is locked
 *
 * @param field - Field name to check
 * @param phase - Current workspace phase
 * @returns True if field is locked (read-only) in the current phase
 *
 * @example
 * ```tsx
 * const isLocked = isFieldLocked('acceptance_criteria', 'execution')
 * <Input disabled={isLocked} />
 * ```
 */
export function isFieldLocked(field: string, phase: WorkspacePhase): boolean {
  return isFieldLockedInPhase(field, phase)
}

/**
 * Get all field names for a specific group
 *
 * @param group - Field group name ('basic' | 'planning' | 'execution')
 * @returns Array of field names in the group
 *
 * @example
 * ```tsx
 * const planningFields = getFieldsByGroup('planning')
 * // ['target_release', 'acceptance_criteria', ...]
 * ```
 */
export function getFieldsByGroup(group: 'basic' | 'planning' | 'execution'): string[] {
  const fieldGroups = {
    basic: ['name', 'purpose', 'tags', 'type'],
    planning: [
      'target_release',
      'acceptance_criteria',
      'business_value',
      'customer_impact',
      'strategic_alignment',
      'estimated_hours',
      'priority',
      'stakeholders',
    ],
    execution: [
      'actual_start_date',
      'actual_end_date',
      'actual_hours',
      'progress_percent',
      'blockers',
    ],
  }

  return fieldGroups[group] || []
}

/**
 * Get human-readable label for a field group
 *
 * @param group - Field group name
 * @returns Display label for the group
 *
 * @example
 * ```tsx
 * <h3>{getFieldGroupLabel('planning')}</h3>
 * // Renders: "Planning Details"
 * ```
 */
export function getFieldGroupLabel(group: 'basic' | 'planning' | 'execution'): string {
  const labels = {
    basic: 'Basic Information',
    planning: 'Planning Details',
    execution: 'Execution Tracking',
  }

  return labels[group] || group
}

/**
 * Get helper text explaining field group visibility rules
 *
 * @param group - Field group name
 * @returns Description of when the group is visible/locked
 *
 * @example
 * ```tsx
 * <p className="text-sm text-muted-foreground">
 *   {getFieldGroupHelperText('planning')}
 * </p>
 * ```
 */
export function getFieldGroupHelperText(group: 'basic' | 'planning' | 'execution'): string {
  const helperTexts = {
    basic: 'Always visible and editable in all phases',
    planning: 'Visible from Planning phase onwards, locked from Execution phase onwards',
    execution: 'Visible from Execution phase onwards, always editable',
  }

  return helperTexts[group] || ''
}
