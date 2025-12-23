/**
 * Work Item Types - Consolidated 3-Type System
 *
 * Simplified to 3 core types with phase-aware field visibility.
 * Enhancement is now a flag on features (is_enhancement), not a separate type.
 * Use tags for sub-categorization instead of proliferating types.
 */

// 3 Core Work Item Types
export const WORK_ITEM_TYPES = {
  CONCEPT: 'concept',
  FEATURE: 'feature',
  BUG: 'bug',
} as const

export type WorkItemType = typeof WORK_ITEM_TYPES[keyof typeof WORK_ITEM_TYPES]

// Workspace phases (4-phase system) - Updated 2025-12-13
// design (was research/planning), build (was execution), refine (was review), launch (was complete)
export type WorkspacePhase = 'design' | 'build' | 'refine' | 'launch'

// Legacy phase type for backward compatibility
export type LegacyWorkspacePhase = 'research' | 'planning' | 'execution' | 'review' | 'complete'

// Item type metadata
export const ITEM_TYPE_METADATA: Record<WorkItemType, {
  singular: string
  plural: string
  icon: string
  description: string
  color: string
}> = {
  concept: {
    singular: 'Concept',
    plural: 'Concepts',
    icon: '💡',
    description: 'Unvalidated idea or hypothesis in research phase',
    color: 'blue',
  },
  feature: {
    singular: 'Feature',
    plural: 'Features',
    icon: '⭐',
    description: 'New functionality to be built (use is_enhancement flag for iterations)',
    color: 'purple',
  },
  bug: {
    singular: 'Bug',
    plural: 'Bugs',
    icon: '🐛',
    description: 'Something broken that needs fixing',
    color: 'red',
  },
}

// ============================================================================
// PROGRESS TRACKING (8 states) - Execution Progress
// Formerly called "status" - renamed to "Progress" for clarity
// Used for: tracking execution state (not_started → in_progress → completed)
// ============================================================================
export const PROGRESS_STATES = {
  NOT_STARTED: 'not_started',
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  REVIEW: 'review',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
} as const

export type TimelineProgress = typeof PROGRESS_STATES[keyof typeof PROGRESS_STATES]

// Legacy alias for backwards compatibility
export const TIMELINE_ITEM_STATUSES = PROGRESS_STATES
export type TimelineItemStatus = TimelineProgress

// ============================================================================
// LIFECYCLE STATUS (4 states) - Development Lifecycle Phase
// Updated 2025-12-13: Migrated from 5 phases to 4 phases
// - design (was research/planning) - "Shape your approach"
// - build (was execution) - "Execute with clarity"
// - refine (was review) - "Validate ideas, sharpen solutions"
// - launch (was complete) - "Release, measure, evolve"
// ============================================================================
export const LIFECYCLE_STATUSES = {
  DESIGN: 'design',
  BUILD: 'build',
  REFINE: 'refine',
  LAUNCH: 'launch',
} as const

export type LifecycleStatus = typeof LIFECYCLE_STATUSES[keyof typeof LIFECYCLE_STATUSES]

// Legacy statuses for backward compatibility
export const LEGACY_LIFECYCLE_STATUSES = {
  RESEARCH: 'research',
  PLANNING: 'planning',
  EXECUTION: 'execution',
  REVIEW: 'review',
  COMPLETE: 'complete',
} as const

// Legacy aliases for backwards compatibility
export const TIMELINE_ITEM_PHASES = LIFECYCLE_STATUSES
export type TimelineItemPhase = LifecycleStatus

// Lifecycle Status metadata (shown as "Phase" in UI)
export const LIFECYCLE_STATUS_METADATA: Record<LifecycleStatus, {
  label: string
  tagline: string
  color: string
  bgColor: string
  description: string
  emoji: string
}> = {
  design: {
    label: 'Design',
    tagline: 'Shape your approach, define your path',
    color: 'text-violet-700',
    bgColor: 'bg-violet-100 border-violet-300',
    description: 'Solution architecture, MVP scoping, timeline breakdown',
    emoji: '📐',
  },
  build: {
    label: 'Build',
    tagline: 'Execute with clarity, create with care',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100 border-emerald-300',
    description: 'Active development, implementation, progress tracking',
    emoji: '🔨',
  },
  refine: {
    label: 'Refine',
    tagline: 'Validate ideas, sharpen solutions',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100 border-amber-300',
    description: 'User testing, feedback collection, bug fixing',
    emoji: '✨',
  },
  launch: {
    label: 'Launch',
    tagline: 'Release, measure, and evolve',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-300',
    description: 'Ship to production, metrics collection, retrospectives',
    emoji: '🚀',
  },
}

// Legacy metadata for backward compatibility
export const LEGACY_LIFECYCLE_STATUS_METADATA: Record<string, {
  label: string
  color: string
  bgColor: string
  description: string
  migratesTo: LifecycleStatus
}> = {
  research: {
    label: 'Research',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100 border-indigo-300',
    description: 'Investigating requirements and approach',
    migratesTo: 'design',
  },
  planning: {
    label: 'Planning',
    color: 'text-violet-700',
    bgColor: 'bg-violet-100 border-violet-300',
    description: 'Defining scope and timeline',
    migratesTo: 'design',
  },
  execution: {
    label: 'Execution',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100 border-emerald-300',
    description: 'Active development',
    migratesTo: 'build',
  },
  review: {
    label: 'Review',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100 border-amber-300',
    description: 'Testing and validation',
    migratesTo: 'refine',
  },
  complete: {
    label: 'Complete',
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-300',
    description: 'Finished',
    migratesTo: 'launch',
  },
}

// Legacy alias for backwards compatibility
export const PHASE_METADATA = LIFECYCLE_STATUS_METADATA

/**
 * Get lifecycle status label (shown as "Phase" in UI)
 * Supports both new and legacy phase values
 */
export function getLifecycleStatusLabel(status: LifecycleStatus | string): string {
  // Check new phases first
  if (status in LIFECYCLE_STATUS_METADATA) {
    return LIFECYCLE_STATUS_METADATA[status as LifecycleStatus].label
  }
  // Check legacy phases
  if (status in LEGACY_LIFECYCLE_STATUS_METADATA) {
    return LEGACY_LIFECYCLE_STATUS_METADATA[status].label
  }
  return status
}

/**
 * Get lifecycle status color class
 * Supports both new and legacy phase values
 */
export function getLifecycleStatusColor(status: LifecycleStatus | string): string {
  if (status in LIFECYCLE_STATUS_METADATA) {
    return LIFECYCLE_STATUS_METADATA[status as LifecycleStatus].color
  }
  if (status in LEGACY_LIFECYCLE_STATUS_METADATA) {
    return LEGACY_LIFECYCLE_STATUS_METADATA[status].color
  }
  return 'text-gray-700'
}

/**
 * Get lifecycle status background color class
 * Supports both new and legacy phase values
 */
export function getLifecycleStatusBgColor(status: LifecycleStatus | string): string {
  if (status in LIFECYCLE_STATUS_METADATA) {
    return LIFECYCLE_STATUS_METADATA[status as LifecycleStatus].bgColor
  }
  if (status in LEGACY_LIFECYCLE_STATUS_METADATA) {
    return LEGACY_LIFECYCLE_STATUS_METADATA[status].bgColor
  }
  return 'bg-gray-100 border-gray-300'
}

/**
 * Migrate legacy phase to new phase
 */
export function migrateLifecyclePhase(phase: string): LifecycleStatus {
  if (phase in LIFECYCLE_STATUS_METADATA) {
    return phase as LifecycleStatus
  }
  if (phase in LEGACY_LIFECYCLE_STATUS_METADATA) {
    return LEGACY_LIFECYCLE_STATUS_METADATA[phase].migratesTo
  }
  return 'design' // Default
}

// Legacy function aliases for backwards compatibility
export const getPhaseLabel = getLifecycleStatusLabel
export const getPhaseColor = getLifecycleStatusColor
export const getPhaseBgColor = getLifecycleStatusBgColor

// ============================================================================
// PROGRESS METADATA (8-state execution tracking)
// Formerly called "STATUS_METADATA" - renamed to PROGRESS_METADATA
// Used in UI as "Progress" indicator
// ============================================================================
export const PROGRESS_METADATA: Record<TimelineProgress, {
  label: string
  color: string
  description: string
}> = {
  not_started: {
    label: 'Not Started',
    color: 'gray',
    description: 'Work hasn\'t begun yet',
  },
  planning: {
    label: 'Planning',
    color: 'blue',
    description: 'Defining requirements and approach',
  },
  in_progress: {
    label: 'In Progress',
    color: 'yellow',
    description: 'Actively being worked on',
  },
  blocked: {
    label: 'Blocked',
    color: 'red',
    description: 'Waiting on external dependency',
  },
  review: {
    label: 'In Review',
    color: 'purple',
    description: 'Under review before completion',
  },
  completed: {
    label: 'Completed',
    color: 'green',
    description: 'Work is done',
  },
  on_hold: {
    label: 'On Hold',
    color: 'orange',
    description: 'Paused temporarily',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'gray',
    description: 'Work was stopped and won\'t continue',
  },
}

// Legacy alias for backwards compatibility
export const STATUS_METADATA = PROGRESS_METADATA

// Feedback source types (3 types)
export const FEEDBACK_SOURCES = {
  INTERNAL: 'internal',
  CUSTOMER: 'customer',
  USER: 'user',
} as const

export type FeedbackSource = typeof FEEDBACK_SOURCES[keyof typeof FEEDBACK_SOURCES]

// Feedback priorities (2 levels - forces clear decisions)
export const FEEDBACK_PRIORITIES = {
  HIGH: 'high',
  LOW: 'low',
} as const

export type FeedbackPriority = typeof FEEDBACK_PRIORITIES[keyof typeof FEEDBACK_PRIORITIES]

// Feedback statuses
export const FEEDBACK_STATUSES = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  IMPLEMENTED: 'implemented',
  DEFERRED: 'deferred',
  REJECTED: 'rejected',
} as const

export type FeedbackStatus = typeof FEEDBACK_STATUSES[keyof typeof FEEDBACK_STATUSES]

/**
 * Get the appropriate item types for a given workspace phase
 * All 4 types are available in all phases - phase affects field visibility, not types
 */
export function getPhaseItemTypes(phase: WorkspacePhase): WorkItemType[] {
  return Object.values(WORK_ITEM_TYPES)
}

/**
 * Get dynamic label for an item type
 */
export function getItemLabel(type: WorkItemType | string, plural = false): string {
  const typeInfo = ITEM_TYPE_METADATA[type as WorkItemType]
  if (!typeInfo) {
    return plural ? 'Work Items' : 'Work Item'
  }
  return plural ? typeInfo.plural : typeInfo.singular
}

/**
 * Get icon for an item type
 */
export function getItemIcon(type: WorkItemType | string): string {
  return ITEM_TYPE_METADATA[type as WorkItemType]?.icon || '📋'
}

/**
 * Get description for an item type
 */
export function getItemDescription(type: WorkItemType | string): string {
  return ITEM_TYPE_METADATA[type as WorkItemType]?.description || 'A work item in your product roadmap'
}

/**
 * Get color for an item type
 */
export function getItemColor(type: WorkItemType | string): string {
  return ITEM_TYPE_METADATA[type as WorkItemType]?.color || 'gray'
}

/**
 * Get progress label (8-state execution progress)
 */
export function getProgressLabel(progress: TimelineProgress | string): string {
  return PROGRESS_METADATA[progress as TimelineProgress]?.label || progress
}

/**
 * Get progress color (8-state execution progress)
 */
export function getProgressColor(progress: TimelineProgress | string): string {
  return PROGRESS_METADATA[progress as TimelineProgress]?.color || 'gray'
}

// Legacy aliases for backwards compatibility
export const getStatusLabel = getProgressLabel
export const getStatusColor = getProgressColor

/**
 * Check if field should be visible/editable based on phase
 *
 * 4-Phase System (2025-12-13):
 * - design: Basic fields + Design fields (scope, acceptance criteria)
 * - build: All fields visible, Design fields locked
 * - refine: All fields visible, Design fields locked
 * - launch: All fields visible, all locked (read-only)
 */
export function isFieldVisibleInPhase(field: string, phase: WorkspacePhase | string): boolean {
  // Migrate legacy phases
  const normalizedPhase = migrateLifecyclePhase(phase)

  // Fields always visible in all phases (Group 1: Basic Information)
  const basicFields = ['name', 'purpose', 'tags', 'type']
  if (basicFields.includes(field)) return true

  // Fields visible from Design phase (Group 2: Design Details)
  // Design = planning, scoping, architecture
  const designFields = [
    'target_release',
    'acceptance_criteria',
    'business_value',
    'customer_impact',
    'strategic_alignment',
    'estimated_hours',
    'priority',
    'stakeholders',
  ]
  if (designFields.includes(field)) {
    // Visible in all phases (design, build, refine, launch)
    return true
  }

  // Fields visible from Build phase onwards (Group 3: Build Tracking)
  const buildFields = [
    'actual_start_date',
    'actual_end_date',
    'actual_hours',
    'progress_percent',
    'blockers',
  ]
  if (buildFields.includes(field)) {
    return ['build', 'refine', 'launch'].includes(normalizedPhase)
  }

  return false
}

/**
 * Check if field should be locked (read-only) based on phase
 *
 * 4-Phase System:
 * - design: Nothing locked (all editable)
 * - build: Design fields LOCKED (can't change scope mid-build)
 * - refine: Design fields LOCKED
 * - launch: Everything LOCKED (historical record)
 */
export function isFieldLockedInPhase(field: string, phase: WorkspacePhase | string): boolean {
  // Migrate legacy phases
  const normalizedPhase = migrateLifecyclePhase(phase)

  // Design fields lock once in Build phase
  const designFields = [
    'target_release',
    'acceptance_criteria',
    'business_value',
    'estimated_hours',
    'customer_impact',
    'strategic_alignment',
  ]
  if (designFields.includes(field)) {
    return ['build', 'refine', 'launch'].includes(normalizedPhase)
  }

  // All fields locked in Launch phase (historical record)
  if (normalizedPhase === 'launch') {
    return true
  }

  return false
}

/**
 * Get suggested priority for feedback based on source
 */
export function getSuggestedPriority(source: FeedbackSource): FeedbackPriority {
  // Customers are paying users - default to high priority
  if (source === FEEDBACK_SOURCES.CUSTOMER) {
    return FEEDBACK_PRIORITIES.HIGH
  }
  // Internal and non-paying users - default to low
  return FEEDBACK_PRIORITIES.LOW
}

/**
 * Get conversion-appropriate types (what an item can be converted to)
 * Simplified 3-type system: concept → feature/bug, feature ↔ bug
 * Note: When converting to feature, UI can optionally set is_enhancement flag
 */
export function getConversionTargets(currentType: WorkItemType): WorkItemType[] {
  const conversionMap: Record<WorkItemType, WorkItemType[]> = {
    concept: [WORK_ITEM_TYPES.FEATURE, WORK_ITEM_TYPES.BUG],
    feature: [WORK_ITEM_TYPES.BUG],
    bug: [WORK_ITEM_TYPES.FEATURE],
  }

  return conversionMap[currentType] || []
}

/**
 * Get phase-appropriate helper text
 */
export function getPhaseHelperText(phase: WorkspacePhase | string): string {
  const normalizedPhase = migrateLifecyclePhase(phase)
  const phaseHelpers: Record<LifecycleStatus, string> = {
    design: 'Design phase - Shape your approach, define scope and acceptance criteria',
    build: 'Build phase - Execute with clarity, Design fields locked',
    refine: 'Refine phase - Validate ideas, gather feedback, polish solutions',
    launch: 'Launch phase - Ship, measure success, retrospectives',
  }
  return phaseHelpers[normalizedPhase] || ''
}
