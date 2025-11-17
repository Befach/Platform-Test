/**
 * Work Item Types and Phase-Aware Mappings
 *
 * This file defines the relationship between workspace phases and available item types.
 * It provides dynamic labels to support universal terminology instead of hardcoded "feature".
 */

// All available work item types
export const WORK_ITEM_TYPES = {
  // Research Phase
  IDEA: 'idea',
  EXPLORATION: 'exploration',
  USER_NEED: 'user_need',

  // Planning Phase
  CORE_FEATURE: 'core_feature',
  ENHANCEMENT: 'enhancement',

  // Review Phase
  USER_REQUEST: 'user_request',

  // Execution Phase
  BUG_FIX: 'bug_fix',
  TECHNICAL_DEBT: 'technical_debt',
  INTEGRATION: 'integration',

  // Testing Phase
  PERFORMANCE_IMPROVEMENT: 'performance_improvement',
  QUALITY_ENHANCEMENT: 'quality_enhancement',

  // Metrics Phase
  ANALYTICS_FEATURE: 'analytics_feature',
  OPTIMIZATION: 'optimization',
} as const

export type WorkItemType = typeof WORK_ITEM_TYPES[keyof typeof WORK_ITEM_TYPES]

// Workspace phases
export type WorkspacePhase = 'research' | 'planning' | 'review' | 'execution' | 'testing' | 'metrics' | 'complete'

// Phase-aware type mappings
export const PHASE_ITEM_TYPES: Record<WorkspacePhase, WorkItemType[]> = {
  research: [
    WORK_ITEM_TYPES.IDEA,
    WORK_ITEM_TYPES.EXPLORATION,
    WORK_ITEM_TYPES.USER_NEED,
  ],
  planning: [
    WORK_ITEM_TYPES.CORE_FEATURE,
    WORK_ITEM_TYPES.ENHANCEMENT,
  ],
  review: [
    WORK_ITEM_TYPES.CORE_FEATURE,
    WORK_ITEM_TYPES.ENHANCEMENT,
    WORK_ITEM_TYPES.USER_REQUEST,
  ],
  execution: [
    WORK_ITEM_TYPES.CORE_FEATURE,
    WORK_ITEM_TYPES.ENHANCEMENT,
    WORK_ITEM_TYPES.BUG_FIX,
    WORK_ITEM_TYPES.TECHNICAL_DEBT,
    WORK_ITEM_TYPES.INTEGRATION,
  ],
  testing: [
    WORK_ITEM_TYPES.BUG_FIX,
    WORK_ITEM_TYPES.PERFORMANCE_IMPROVEMENT,
    WORK_ITEM_TYPES.QUALITY_ENHANCEMENT,
  ],
  metrics: [
    WORK_ITEM_TYPES.ANALYTICS_FEATURE,
    WORK_ITEM_TYPES.OPTIMIZATION,
  ],
  complete: [], // All types available in complete phase (handled separately)
}

// Item type labels (singular and plural)
export const ITEM_TYPE_LABELS: Record<WorkItemType, { singular: string; plural: string; icon: string; description: string }> = {
  // Research Phase
  idea: {
    singular: 'Idea',
    plural: 'Ideas',
    icon: '💡',
    description: 'Raw concept or hypothesis to explore',
  },
  exploration: {
    singular: 'Exploration',
    plural: 'Explorations',
    icon: '🔍',
    description: 'Experimental feature direction or investigation',
  },
  user_need: {
    singular: 'User Need',
    plural: 'User Needs',
    icon: '👤',
    description: 'Identified user problem or requirement',
  },

  // Planning Phase
  core_feature: {
    singular: 'Feature',
    plural: 'Features',
    icon: '⭐',
    description: 'Primary product functionality',
  },
  enhancement: {
    singular: 'Enhancement',
    plural: 'Enhancements',
    icon: '✨',
    description: 'Improvement to existing capability',
  },

  // Review Phase
  user_request: {
    singular: 'User Request',
    plural: 'User Requests',
    icon: '📝',
    description: 'Specific stakeholder ask or feedback',
  },

  // Execution Phase
  bug_fix: {
    singular: 'Bug Fix',
    plural: 'Bug Fixes',
    icon: '🐛',
    description: 'Defect resolution or error correction',
  },
  technical_debt: {
    singular: 'Technical Debt',
    plural: 'Technical Debt Items',
    icon: '🔧',
    description: 'Code quality improvement or refactoring',
  },
  integration: {
    singular: 'Integration',
    plural: 'Integrations',
    icon: '🔗',
    description: 'Third-party service connection',
  },

  // Testing Phase
  performance_improvement: {
    singular: 'Performance Improvement',
    plural: 'Performance Improvements',
    icon: '⚡',
    description: 'Speed or efficiency optimization',
  },
  quality_enhancement: {
    singular: 'Quality Enhancement',
    plural: 'Quality Enhancements',
    icon: '✅',
    description: 'UX polish or quality improvement',
  },

  // Metrics Phase
  analytics_feature: {
    singular: 'Analytics Feature',
    plural: 'Analytics Features',
    icon: '📊',
    description: 'Tracking or measurement capability',
  },
  optimization: {
    singular: 'Optimization',
    plural: 'Optimizations',
    icon: '📈',
    description: 'Data-driven improvement',
  },
}

/**
 * Get the appropriate item types for a given workspace phase
 * @param phase - Current workspace phase
 * @param showAll - Override to show all types regardless of phase
 * @returns Array of available work item types
 */
export function getPhaseItemTypes(phase: WorkspacePhase, showAll = false): WorkItemType[] {
  if (showAll || phase === 'complete') {
    return Object.values(WORK_ITEM_TYPES)
  }

  return PHASE_ITEM_TYPES[phase] || []
}

/**
 * Get dynamic label for an item type
 * @param type - Work item type
 * @param plural - Return plural form
 * @returns Localized label string
 */
export function getItemLabel(type: WorkItemType | string, plural = false): string {
  const typeInfo = ITEM_TYPE_LABELS[type as WorkItemType]
  if (!typeInfo) {
    return plural ? 'Work Items' : 'Work Item'
  }

  return plural ? typeInfo.plural : typeInfo.singular
}

/**
 * Get icon for an item type
 * @param type - Work item type
 * @returns Emoji icon
 */
export function getItemIcon(type: WorkItemType | string): string {
  return ITEM_TYPE_LABELS[type as WorkItemType]?.icon || '📋'
}

/**
 * Get description for an item type
 * @param type - Work item type
 * @returns Description string
 */
export function getItemDescription(type: WorkItemType | string): string {
  return ITEM_TYPE_LABELS[type as WorkItemType]?.description || 'A work item in your product roadmap'
}

/**
 * Check if a type is valid for a given phase
 * @param type - Work item type to check
 * @param phase - Current workspace phase
 * @returns True if type is valid for phase
 */
export function isTypeValidForPhase(type: WorkItemType, phase: WorkspacePhase): boolean {
  if (phase === 'complete') {
    return true // All types valid in complete phase
  }

  return PHASE_ITEM_TYPES[phase]?.includes(type) || false
}

/**
 * Get conversion-appropriate types (what an item can be converted to)
 * @param currentType - Current item type
 * @param phase - Current workspace phase
 * @returns Array of types this item can be converted to
 */
export function getConversionTargets(currentType: WorkItemType, phase: WorkspacePhase): WorkItemType[] {
  const phaseTypes = getPhaseItemTypes(phase, true)

  // Common conversion patterns
  const conversionMap: Partial<Record<WorkItemType, WorkItemType[]>> = {
    idea: [WORK_ITEM_TYPES.USER_NEED, WORK_ITEM_TYPES.CORE_FEATURE, WORK_ITEM_TYPES.EXPLORATION],
    exploration: [WORK_ITEM_TYPES.CORE_FEATURE, WORK_ITEM_TYPES.ENHANCEMENT],
    user_need: [WORK_ITEM_TYPES.CORE_FEATURE, WORK_ITEM_TYPES.ENHANCEMENT, WORK_ITEM_TYPES.USER_REQUEST],
    user_request: [WORK_ITEM_TYPES.CORE_FEATURE, WORK_ITEM_TYPES.ENHANCEMENT, WORK_ITEM_TYPES.BUG_FIX],
    core_feature: [WORK_ITEM_TYPES.ENHANCEMENT, WORK_ITEM_TYPES.TECHNICAL_DEBT],
    enhancement: [WORK_ITEM_TYPES.CORE_FEATURE, WORK_ITEM_TYPES.TECHNICAL_DEBT],
    bug_fix: [WORK_ITEM_TYPES.ENHANCEMENT, WORK_ITEM_TYPES.TECHNICAL_DEBT],
  }

  const targets = conversionMap[currentType] || []

  // Filter to only types available in current phase or all types if in complete phase
  return targets.filter(target =>
    phase === 'complete' || phaseTypes.includes(target)
  )
}

/**
 * Get phase-appropriate helper text for the type selector
 * @param phase - Current workspace phase
 * @param showAll - Whether showing all types
 * @returns Helper text string
 */
export function getPhaseHelperText(phase: WorkspacePhase, showAll: boolean): string {
  if (showAll) {
    return 'Showing all item types (override active)'
  }

  const phaseLabels: Record<WorkspacePhase, string> = {
    research: 'Research phase - Focus on discovery and ideation',
    planning: 'Planning phase - Define core features and enhancements',
    review: 'Review phase - Gather and organize feedback',
    execution: 'Execution phase - Build features and fix issues',
    testing: 'Testing phase - Improve quality and performance',
    metrics: 'Metrics phase - Track and optimize outcomes',
    complete: 'Completed - All item types available',
  }

  return phaseLabels[phase] || ''
}
