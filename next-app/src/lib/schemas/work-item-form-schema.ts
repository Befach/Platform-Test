/**
 * Work Item Form Validation Schemas
 *
 * Phase-aware Zod schemas that validate only the fields visible/required
 * for each workspace phase. This ensures form validation matches the
 * progressive disclosure pattern used in the work item form UI.
 *
 * Schema Selection:
 * - Research: baseSchema (name, purpose, type, tags)
 * - Planning: planningSchema (+ planning fields)
 * - Execution/Review/Complete: executionSchema (+ execution tracking fields)
 */

import { z } from 'zod'
import { WORK_ITEM_TYPES, type WorkspacePhase } from '@/lib/constants/work-item-types'

/**
 * Base Schema - Research Phase
 *
 * Validates only the essential fields needed to capture an idea:
 * - name: What is it?
 * - purpose: Why does it matter?
 * - type: What kind of work is it?
 * - tags: Optional categorization
 */
const baseSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .trim(),

  purpose: z
    .string()
    .min(1, 'Purpose is required - explain why this matters')
    .trim(),

  type: z.enum([
    WORK_ITEM_TYPES.CONCEPT,
    WORK_ITEM_TYPES.FEATURE,
    WORK_ITEM_TYPES.BUG,
  ] as const, {
    message: 'Please select a valid work item type',
  }),

  tags: z
    .array(z.string().trim().min(1))
    .optional()
    .default([]),

  is_enhancement: z
    .boolean()
    .optional()
    .default(false),
})

/**
 * Planning Schema - Planning Phase
 *
 * Extends base schema with planning fields:
 * - Business context (value, impact, alignment)
 * - Release planning (target_release, acceptance_criteria)
 * - Effort estimation (estimated_hours, priority)
 * - Stakeholder tracking
 */
const planningSchema = baseSchema.extend({
  target_release: z
    .string()
    .trim()
    .optional(),

  acceptance_criteria: z
    .string()
    .trim()
    .optional(),

  business_value: z
    .string()
    .trim()
    .optional(),

  customer_impact: z
    .string()
    .trim()
    .optional(),

  strategic_alignment: z
    .string()
    .trim()
    .optional(),

  estimated_hours: z
    .number()
    .int('Estimated hours must be a whole number')
    .min(0, 'Estimated hours cannot be negative')
    .max(10000, 'Estimated hours seems unrealistic (max 10,000)')
    .optional()
    .nullable()
    .transform((val) => val === null ? undefined : val),

  priority: z
    .string()
    .trim()
    .optional(),

  stakeholders: z
    .array(z.string().trim().min(1))
    .optional()
    .default([]),
})

/**
 * Execution Schema - Execution, Review, Complete Phases
 *
 * Extends planning schema with execution tracking fields:
 * - Actual dates (start, end)
 * - Time tracking (actual_hours vs estimated_hours)
 * - Progress tracking (progress_percent)
 * - Blocker tracking
 *
 * Note: Planning fields become read-only in these phases,
 * but validation still includes them for data integrity.
 */
const executionSchema = planningSchema.extend({
  actual_start_date: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'Start date must be a valid date' }
    )
    .transform((val) => val === null ? undefined : val),

  actual_end_date: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'End date must be a valid date' }
    )
    .transform((val) => val === null ? undefined : val),

  actual_hours: z
    .number()
    .int('Actual hours must be a whole number')
    .min(0, 'Actual hours cannot be negative')
    .max(10000, 'Actual hours seems unrealistic (max 10,000)')
    .optional()
    .nullable()
    .transform((val) => val === null ? undefined : val),

  progress_percent: z
    .number()
    .int('Progress must be a whole number')
    .min(0, 'Progress cannot be less than 0%')
    .max(100, 'Progress cannot exceed 100%')
    .optional()
    .nullable()
    .transform((val) => val === null ? undefined : val),

  blockers: z
    .array(z.string().trim().min(1, 'Blocker description cannot be empty'))
    .optional()
    .default([]),
}).refine(
  (data) => {
    // If both dates provided, end date must be after start date
    if (data.actual_start_date && data.actual_end_date) {
      const start = new Date(data.actual_start_date)
      const end = new Date(data.actual_end_date)
      return end >= start
    }
    return true
  },
  {
    message: 'End date must be on or after start date',
    path: ['actual_end_date'],
  }
)

/**
 * Get the appropriate validation schema for a workspace phase
 *
 * @param phase - Current workspace phase
 * @returns Zod schema with phase-appropriate validations
 *
 * @example
 * ```ts
 * const schema = getWorkItemSchema('planning')
 * const result = schema.safeParse(formData)
 * if (!result.success) {
 *   console.error(result.error.flatten())
 * }
 * ```
 */
export function getWorkItemSchema(phase: WorkspacePhase) {
  switch (phase) {
    case 'design':
      return planningSchema

    case 'build':
    case 'refine':
    case 'launch':
      return executionSchema

    default:
      // Fallback to base schema for unknown phases
      return baseSchema
  }
}

/**
 * TypeScript types inferred from schemas
 *
 * Use these for type-safe form handling:
 * - BaseWorkItemFormData: Research phase
 * - PlanningWorkItemFormData: Planning phase
 * - ExecutionWorkItemFormData: Execution, Review, Complete phases
 */
export type BaseWorkItemFormData = z.infer<typeof baseSchema>
export type PlanningWorkItemFormData = z.infer<typeof planningSchema>
export type ExecutionWorkItemFormData = z.infer<typeof executionSchema>

/**
 * Union type for all possible form data shapes
 */
export type WorkItemFormData =
  | BaseWorkItemFormData
  | PlanningWorkItemFormData
  | ExecutionWorkItemFormData

/**
 * Helper to validate work item data against the appropriate schema
 *
 * @param data - Form data to validate
 * @param phase - Current workspace phase
 * @returns Validation result with typed data or errors
 *
 * @example
 * ```ts
 * const result = validateWorkItem(formData, 'planning')
 * if (result.success) {
 *   await saveWorkItem(result.data)
 * } else {
 *   console.error(result.error.flatten())
 * }
 * ```
 */
export function validateWorkItem(data: unknown, phase: WorkspacePhase) {
  const schema = getWorkItemSchema(phase)
  return schema.safeParse(data)
}

/**
 * Type guard to check if data matches a specific schema type
 *
 * @example
 * ```ts
 * if (isExecutionFormData(data)) {
 *   console.log(data.actual_hours) // TypeScript knows this exists
 * }
 * ```
 */
export function isExecutionFormData(
  data: WorkItemFormData
): data is ExecutionWorkItemFormData {
  return 'actual_start_date' in data || 'actual_hours' in data
}

export function isPlanningFormData(
  data: WorkItemFormData
): data is PlanningWorkItemFormData {
  return (
    'target_release' in data ||
    'acceptance_criteria' in data ||
    'estimated_hours' in data
  )
}

export function isBaseFormData(
  data: WorkItemFormData
): data is BaseWorkItemFormData {
  return !isPlanningFormData(data) && !isExecutionFormData(data)
}
