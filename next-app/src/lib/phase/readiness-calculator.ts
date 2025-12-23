/**
 * Phase Readiness Calculator
 *
 * Calculates phase readiness percentage and transition eligibility for work items.
 * Uses weight-based field completion with required vs optional distinction.
 *
 * TYPE-AWARE PHASE SYSTEM (Updated 2025-12-16):
 * - Feature: design → build → refine → launch
 * - Concept: ideation → research → validated | rejected
 * - Bug: triage → investigating → fixing → verified
 * - Enhancement: design → build → refine → launch (same as Feature)
 *
 * @module lib/phase/readiness-calculator
 */

import type {
  WorkspacePhase,
  WorkItemType,
  AnyWorkItemPhase,
  ConceptPhase,
  BugPhase,
} from '@/lib/constants/workspace-phases'
import {
  getNextPhaseForType,
  isTerminalPhase,
} from '@/lib/constants/workspace-phases'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Work item with all fields needed for readiness calculation
 */
export interface WorkItemForReadiness {
  id: string
  name: string
  purpose: string | null
  type: string // WorkItemType as string for flexibility
  phase: string // AnyWorkItemPhase as string for flexibility
  // Design/Feature fields
  target_release?: string | null
  acceptance_criteria?: string | null
  business_value?: string | null
  customer_impact?: string | null
  strategic_alignment?: string | null
  estimated_hours?: number | null
  priority?: string | null
  // Build fields
  actual_start_date?: string | null
  actual_end_date?: string | null
  actual_hours?: number | null
  progress_percent?: number | null
  // Concept-specific fields
  hypothesis?: string | null
  target_users?: string | null
  success_criteria?: string | null
  validation_results?: string | null
  // Bug-specific fields
  reproduction_steps?: string | null
  severity?: string | null
  affected_users?: string | null
  root_cause?: string | null
  // Metadata
  quality_approved?: boolean
}

/**
 * Field weight configuration for readiness calculation
 */
export interface FieldWeight {
  field: string
  weight: number
  required: boolean
  /** Validation function - returns true if field is "filled" */
  isFilled: (value: unknown) => boolean
}

/**
 * Phase-specific field weights (type-aware)
 */
export interface PhaseFieldConfig {
  phase: string // AnyWorkItemPhase
  targetPhase: string // AnyWorkItemPhase
  workItemType: WorkItemType // Which type this applies to
  fields: FieldWeight[]
}

/**
 * A field that is missing or incomplete
 */
export interface MissingField {
  field: string
  label: string
  required: boolean
  hint: string
}

/**
 * Result of readiness calculation
 */
export interface PhaseReadiness {
  /** Current phase of the work item */
  currentPhase: string // AnyWorkItemPhase
  /** Next phase if upgrade is possible */
  nextPhase: string | null // AnyWorkItemPhase | null
  /** Work item type */
  workItemType: WorkItemType
  /** Overall readiness percentage (0-100) */
  readinessPercent: number
  /** Whether all required transition requirements are met */
  canUpgrade: boolean
  /** Whether this is a terminal phase */
  isTerminal: boolean
  /** Fields that are missing or incomplete */
  missingFields: MissingField[]
  /** Fields that are complete */
  completedFields: string[]
  /** Breakdown of required vs optional completion */
  breakdown: {
    requiredPercent: number
    optionalPercent: number
  }
  /** Suggestions for improving readiness */
  suggestions: string[]
}

// ============================================================================
// FIELD CONFIGURATIONS BY PHASE TRANSITION
// ============================================================================

// =============================================================================
// FEATURE/ENHANCEMENT PHASE TRANSITIONS
// =============================================================================

/**
 * Design → Build transition requirements (Feature/Enhancement)
 *
 * Required:
 * - purpose: Explain why this matters (25%)
 * - acceptance_criteria: Define "done" (20%)
 * - has_scope: Timeline items OR acceptance criteria (25%)
 *
 * Optional:
 * - target_release, estimated_hours, priority, business_value (30% total)
 */
export const DESIGN_TO_BUILD_CONFIG: PhaseFieldConfig = {
  phase: 'design',
  targetPhase: 'build',
  workItemType: 'feature',
  fields: [
    // Required fields (70% weight)
    {
      field: 'purpose',
      weight: 25,
      required: true,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 10,
    },
    {
      field: 'acceptance_criteria',
      weight: 20,
      required: true,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 0,
    },
    {
      field: 'has_scope',
      weight: 25,
      required: true,
      isFilled: (v) => v === true,
    },
    // Optional fields (30% weight)
    {
      field: 'target_release',
      weight: 8,
      required: false,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 0,
    },
    {
      field: 'estimated_hours',
      weight: 7,
      required: false,
      isFilled: (v) => typeof v === 'number' && v > 0,
    },
    {
      field: 'priority',
      weight: 7,
      required: false,
      isFilled: (v) => typeof v === 'string' && v.length > 0,
    },
    {
      field: 'business_value',
      weight: 8,
      required: false,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 0,
    },
  ],
}

/**
 * Build → Refine transition requirements
 *
 * Required:
 * - progress_percent >= 80 (40%)
 * - actual_start_date set (30%)
 *
 * Optional:
 * - actual_hours, blockers_documented (30% total)
 */
export const BUILD_TO_REFINE_CONFIG: PhaseFieldConfig = {
  phase: 'build',
  targetPhase: 'refine',
  workItemType: 'feature',
  fields: [
    // Required fields (70% weight)
    {
      field: 'progress_percent',
      weight: 40,
      required: true,
      isFilled: (v) => typeof v === 'number' && v >= 80,
    },
    {
      field: 'actual_start_date',
      weight: 30,
      required: true,
      isFilled: (v) => typeof v === 'string' && v.length > 0,
    },
    // Optional fields (30% weight)
    {
      field: 'actual_hours',
      weight: 15,
      required: false,
      isFilled: (v) => typeof v === 'number' && v > 0,
    },
    {
      field: 'blockers_documented',
      weight: 15,
      required: false,
      isFilled: (v) => v === true,
    },
  ],
}

/**
 * Refine → Launch transition requirements
 *
 * Required:
 * - feedback_addressed: No pending critical feedback (40%)
 * - progress_percent >= 95 (30%)
 *
 * Optional:
 * - quality_approved, actual_end_date (30% total)
 */
export const REFINE_TO_LAUNCH_CONFIG: PhaseFieldConfig = {
  phase: 'refine',
  targetPhase: 'launch',
  workItemType: 'feature',
  fields: [
    // Required fields (70% weight)
    {
      field: 'feedback_addressed',
      weight: 40,
      required: true,
      isFilled: (v) => v === true,
    },
    {
      field: 'progress_percent',
      weight: 30,
      required: true,
      isFilled: (v) => typeof v === 'number' && v >= 95,
    },
    // Optional fields (30% weight)
    {
      field: 'quality_approved',
      weight: 15,
      required: false,
      isFilled: (v) => v === true,
    },
    {
      field: 'actual_end_date',
      weight: 15,
      required: false,
      isFilled: (v) => typeof v === 'string' && v.length > 0,
    },
  ],
}

// =============================================================================
// CONCEPT PHASE TRANSITIONS
// =============================================================================

/**
 * Ideation → Research transition requirements (Concept)
 *
 * Required:
 * - hypothesis: Core assumption to test (35%)
 * - target_users: Who will benefit (35%)
 *
 * Optional:
 * - purpose, success_criteria (30% total)
 */
export const IDEATION_TO_RESEARCH_CONFIG: PhaseFieldConfig = {
  phase: 'ideation',
  targetPhase: 'research',
  workItemType: 'concept',
  fields: [
    // Required fields (70% weight)
    {
      field: 'hypothesis',
      weight: 35,
      required: true,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 10,
    },
    {
      field: 'target_users',
      weight: 35,
      required: true,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 5,
    },
    // Optional fields (30% weight)
    {
      field: 'purpose',
      weight: 15,
      required: false,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 0,
    },
    {
      field: 'success_criteria',
      weight: 15,
      required: false,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 0,
    },
  ],
}

/**
 * Research → Validated transition requirements (Concept)
 *
 * Required:
 * - validation_results: Research findings documented (40%)
 * - success_criteria: Clear criteria defined (30%)
 *
 * Optional:
 * - decision_ready computed field (30% total)
 */
export const RESEARCH_TO_VALIDATED_CONFIG: PhaseFieldConfig = {
  phase: 'research',
  targetPhase: 'validated',
  workItemType: 'concept',
  fields: [
    // Required fields (70% weight)
    {
      field: 'validation_results',
      weight: 40,
      required: true,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 20,
    },
    {
      field: 'success_criteria',
      weight: 30,
      required: true,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 10,
    },
    // Optional fields (30% weight)
    {
      field: 'business_value',
      weight: 15,
      required: false,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 0,
    },
    {
      field: 'customer_impact',
      weight: 15,
      required: false,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 0,
    },
  ],
}

// =============================================================================
// BUG PHASE TRANSITIONS
// =============================================================================

/**
 * Triage → Investigating transition requirements (Bug)
 *
 * Required:
 * - reproduction_steps: How to reproduce (40%)
 * - severity: Impact level (30%)
 *
 * Optional:
 * - affected_users, purpose (30% total)
 */
export const TRIAGE_TO_INVESTIGATING_CONFIG: PhaseFieldConfig = {
  phase: 'triage',
  targetPhase: 'investigating',
  workItemType: 'bug',
  fields: [
    // Required fields (70% weight)
    {
      field: 'reproduction_steps',
      weight: 40,
      required: true,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 10,
    },
    {
      field: 'severity',
      weight: 30,
      required: true,
      isFilled: (v) => typeof v === 'string' && v.length > 0,
    },
    // Optional fields (30% weight)
    {
      field: 'affected_users',
      weight: 15,
      required: false,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 0,
    },
    {
      field: 'purpose',
      weight: 15,
      required: false,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 0,
    },
  ],
}

/**
 * Investigating → Fixing transition requirements (Bug)
 *
 * Required:
 * - root_cause: Identified root cause (50%)
 * - actual_start_date: Investigation started (20%)
 *
 * Optional:
 * - estimated_hours, priority (30% total)
 */
export const INVESTIGATING_TO_FIXING_CONFIG: PhaseFieldConfig = {
  phase: 'investigating',
  targetPhase: 'fixing',
  workItemType: 'bug',
  fields: [
    // Required fields (70% weight)
    {
      field: 'root_cause',
      weight: 50,
      required: true,
      isFilled: (v) => typeof v === 'string' && v.trim().length > 10,
    },
    {
      field: 'actual_start_date',
      weight: 20,
      required: true,
      isFilled: (v) => typeof v === 'string' && v.length > 0,
    },
    // Optional fields (30% weight)
    {
      field: 'estimated_hours',
      weight: 15,
      required: false,
      isFilled: (v) => typeof v === 'number' && v > 0,
    },
    {
      field: 'priority',
      weight: 15,
      required: false,
      isFilled: (v) => typeof v === 'string' && v.length > 0,
    },
  ],
}

/**
 * Fixing → Verified transition requirements (Bug)
 *
 * Required:
 * - progress_percent >= 100: Fix complete (40%)
 * - fix_verified: QA passed (30%)
 *
 * Optional:
 * - actual_hours, actual_end_date (30% total)
 */
export const FIXING_TO_VERIFIED_CONFIG: PhaseFieldConfig = {
  phase: 'fixing',
  targetPhase: 'verified',
  workItemType: 'bug',
  fields: [
    // Required fields (70% weight)
    {
      field: 'progress_percent',
      weight: 40,
      required: true,
      isFilled: (v) => typeof v === 'number' && v >= 100,
    },
    {
      field: 'fix_verified',
      weight: 30,
      required: true,
      isFilled: (v) => v === true,
    },
    // Optional fields (30% weight)
    {
      field: 'actual_hours',
      weight: 15,
      required: false,
      isFilled: (v) => typeof v === 'number' && v > 0,
    },
    {
      field: 'actual_end_date',
      weight: 15,
      required: false,
      isFilled: (v) => typeof v === 'string' && v.length > 0,
    },
  ],
}

// =============================================================================
// TRANSITION CONFIG MAPS
// =============================================================================

/**
 * Feature/Enhancement transition configs by phase
 */
export const FEATURE_TRANSITIONS: Record<string, PhaseFieldConfig> = {
  design: DESIGN_TO_BUILD_CONFIG,
  build: BUILD_TO_REFINE_CONFIG,
  refine: REFINE_TO_LAUNCH_CONFIG,
}

/**
 * Concept transition configs by phase
 */
export const CONCEPT_TRANSITIONS: Record<string, PhaseFieldConfig> = {
  ideation: IDEATION_TO_RESEARCH_CONFIG,
  research: RESEARCH_TO_VALIDATED_CONFIG,
}

/**
 * Bug transition configs by phase
 */
export const BUG_TRANSITIONS: Record<string, PhaseFieldConfig> = {
  triage: TRIAGE_TO_INVESTIGATING_CONFIG,
  investigating: INVESTIGATING_TO_FIXING_CONFIG,
  fixing: FIXING_TO_VERIFIED_CONFIG,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the field configuration for a phase transition (TYPE-AWARE)
 *
 * @param type - Work item type
 * @param currentPhase - Current phase of the work item
 * @returns PhaseFieldConfig or null if no transition possible
 */
export function getTypePhaseTransitionConfig(
  type: WorkItemType,
  currentPhase: string
): PhaseFieldConfig | null {
  switch (type) {
    case 'concept':
      return CONCEPT_TRANSITIONS[currentPhase] ?? null
    case 'bug':
      return BUG_TRANSITIONS[currentPhase] ?? null
    case 'feature':
      return FEATURE_TRANSITIONS[currentPhase] ?? null
    default:
      return null
  }
}

/**
 * Get the field configuration for a phase transition (LEGACY - Feature only)
 * @deprecated Use getTypePhaseTransitionConfig instead
 */
export function getPhaseTransitionConfig(
  currentPhase: WorkspacePhase
): PhaseFieldConfig | null {
  switch (currentPhase) {
    case 'design':
      return DESIGN_TO_BUILD_CONFIG
    case 'build':
      return BUILD_TO_REFINE_CONFIG
    case 'refine':
      return REFINE_TO_LAUNCH_CONFIG
    case 'launch':
      return null // No upgrade from launch
    default:
      return null
  }
}

/**
 * Human-readable field labels
 */
const FIELD_LABELS: Record<string, string> = {
  // Feature/Enhancement fields
  purpose: 'Purpose',
  acceptance_criteria: 'Acceptance Criteria',
  has_scope: 'Scope Definition',
  target_release: 'Target Release',
  estimated_hours: 'Estimated Hours',
  priority: 'Priority',
  business_value: 'Business Value',
  customer_impact: 'Customer Impact',
  progress_percent: 'Progress',
  actual_start_date: 'Start Date',
  actual_hours: 'Actual Hours',
  blockers_documented: 'Blockers Review',
  feedback_addressed: 'Feedback Addressed',
  quality_approved: 'Quality Approved',
  actual_end_date: 'End Date',
  // Concept-specific fields
  hypothesis: 'Hypothesis',
  target_users: 'Target Users',
  success_criteria: 'Success Criteria',
  validation_results: 'Validation Results',
  // Bug-specific fields
  reproduction_steps: 'Reproduction Steps',
  severity: 'Severity',
  affected_users: 'Affected Users',
  root_cause: 'Root Cause',
  fix_verified: 'Fix Verified',
}

/**
 * Get human-readable field label
 */
export function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field
}

/**
 * Helpful hints for incomplete fields
 */
const FIELD_HINTS: Record<string, string> = {
  // Feature/Enhancement fields
  purpose: 'Explain why this work item matters in 2-3 sentences',
  acceptance_criteria: 'Define what "done" looks like for this item',
  has_scope: 'Add timeline items or define acceptance criteria',
  target_release: 'Set a target release date or version',
  estimated_hours: 'Estimate the effort required',
  priority: 'Set priority to help with planning',
  business_value: 'Describe the business impact',
  customer_impact: 'Describe how customers will be affected',
  progress_percent: 'Update progress to 80%+ to move to refine',
  actual_start_date: 'Set the date work began',
  actual_hours: 'Track actual time spent',
  blockers_documented: 'Review and document any blockers',
  feedback_addressed: 'Address all pending critical feedback',
  quality_approved: 'Mark as quality approved after review',
  actual_end_date: 'Set the completion date',
  // Concept-specific hints
  hypothesis: 'State the core assumption you need to validate',
  target_users: 'Define who will benefit from this concept',
  success_criteria: 'Define measurable criteria for validation',
  validation_results: 'Document research findings and evidence',
  // Bug-specific hints
  reproduction_steps: 'Provide clear steps to reproduce the bug',
  severity: 'Set severity level: critical, high, medium, or low',
  affected_users: 'Estimate how many users are impacted',
  root_cause: 'Document the identified root cause of the bug',
  fix_verified: 'QA must verify the fix before marking complete',
}

/**
 * Get helpful hint for incomplete field
 */
export function getFieldHint(field: string, targetPhase: string): string {
  return FIELD_HINTS[field] || `Complete ${field} to progress to ${targetPhase}`
}

// ============================================================================
// CORE CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate phase readiness for a work item (TYPE-AWARE)
 *
 * @param workItem - Work item data with type and phase
 * @param timelineItemsCount - Number of timeline items (for scope check in features)
 * @param feedbackStats - Feedback statistics (for refine phase)
 * @returns PhaseReadiness object with percentage, canUpgrade, and missing fields
 *
 * @example
 * ```ts
 * const readiness = calculatePhaseReadiness(
 *   { ...workItem, type: 'feature', phase: 'design' },
 *   3, // 3 timeline items
 *   { pendingCritical: 0, total: 5 }
 * )
 *
 * if (readiness.canUpgrade) {
 *   // Show upgrade button
 * }
 * ```
 */
export function calculatePhaseReadiness(
  workItem: WorkItemForReadiness,
  timelineItemsCount: number = 0,
  feedbackStats?: { pendingCritical: number; total: number }
): PhaseReadiness {
  const workItemType = (workItem.type || 'feature') as WorkItemType
  const currentPhase = workItem.phase || ''

  // Check if this is a terminal phase
  const isTerminal = isTerminalPhase(workItemType, currentPhase)

  // Get type-aware transition config
  const config = getTypePhaseTransitionConfig(workItemType, currentPhase)

  // No upgrade possible from terminal phases
  if (!config || isTerminal) {
    return {
      currentPhase,
      nextPhase: null,
      workItemType,
      readinessPercent: 100,
      canUpgrade: false,
      isTerminal,
      missingFields: [],
      completedFields: [],
      breakdown: { requiredPercent: 100, optionalPercent: 100 },
      suggestions: isTerminal
        ? ['This is a terminal phase - no further upgrades available']
        : [],
    }
  }

  // Build values map with computed fields
  const values: Record<string, unknown> = {
    ...workItem,
    // Computed: scope is defined if timeline items exist OR acceptance criteria is set
    has_scope:
      timelineItemsCount > 0 ||
      (typeof workItem.acceptance_criteria === 'string' &&
        workItem.acceptance_criteria.trim().length > 0),
    // Computed: feedback addressed if no pending critical feedback
    feedback_addressed: feedbackStats ? feedbackStats.pendingCritical === 0 : true,
    // Assume blockers are documented unless tracked elsewhere
    blockers_documented: true,
    // For bugs: fix_verified is computed from quality_approved or explicit flag
    fix_verified: workItem.quality_approved === true,
  }

  // Calculate scores
  let requiredScore = 0
  let requiredTotal = 0
  let optionalScore = 0
  let optionalTotal = 0
  const missingFields: MissingField[] = []
  const completedFields: string[] = []
  const suggestions: string[] = []

  for (const fieldConfig of config.fields) {
    const value = values[fieldConfig.field]
    const isFilled = fieldConfig.isFilled(value)

    if (fieldConfig.required) {
      requiredTotal += fieldConfig.weight
      if (isFilled) {
        requiredScore += fieldConfig.weight
        completedFields.push(fieldConfig.field)
      } else {
        missingFields.push({
          field: fieldConfig.field,
          label: getFieldLabel(fieldConfig.field),
          required: true,
          hint: getFieldHint(fieldConfig.field, config.targetPhase),
        })
      }
    } else {
      optionalTotal += fieldConfig.weight
      if (isFilled) {
        optionalScore += fieldConfig.weight
        completedFields.push(fieldConfig.field)
      } else {
        missingFields.push({
          field: fieldConfig.field,
          label: getFieldLabel(fieldConfig.field),
          required: false,
          hint: getFieldHint(fieldConfig.field, config.targetPhase),
        })
      }
    }
  }

  // Calculate percentages
  const requiredPercent =
    requiredTotal > 0 ? (requiredScore / requiredTotal) * 100 : 100
  const optionalPercent =
    optionalTotal > 0 ? (optionalScore / optionalTotal) * 100 : 100

  // Weighted overall: 70% required + 30% optional
  const readinessPercent = Math.round(requiredPercent * 0.7 + optionalPercent * 0.3)

  // Can upgrade only if ALL required fields are complete (100% required)
  const canUpgrade = requiredPercent === 100 && readinessPercent >= 80

  // Generate suggestions based on missing required fields
  const requiredMissing = missingFields.filter((f) => f.required)
  if (requiredMissing.length > 0) {
    suggestions.push(
      `Complete ${requiredMissing.length} required field${requiredMissing.length > 1 ? 's' : ''} to unlock phase upgrade`
    )
  }
  if (requiredPercent === 100 && readinessPercent < 80) {
    suggestions.push('Fill in optional fields to reach 80% readiness')
  }

  return {
    currentPhase,
    nextPhase: config.targetPhase,
    workItemType,
    readinessPercent,
    canUpgrade,
    isTerminal: false,
    missingFields: requiredMissing, // Only show required missing fields in banner
    completedFields,
    breakdown: {
      requiredPercent: Math.round(requiredPercent),
      optionalPercent: Math.round(optionalPercent),
    },
    suggestions,
  }
}
