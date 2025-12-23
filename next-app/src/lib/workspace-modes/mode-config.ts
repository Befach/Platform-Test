/**
 * Extended Workspace Mode Configuration
 *
 * Extends the base workspace-mode.ts with:
 * - Default phase per mode
 * - Visible field configuration (essential vs expanded)
 * - Suggested actions per mode
 * - Dashboard widget configuration
 * - Default work item type per mode
 */

import { WorkspaceMode, WORKSPACE_MODE_CONFIG } from '@/lib/types/workspace-mode'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Work item field names for visibility configuration
 */
export type WorkItemField =
  | 'name'
  | 'type'
  | 'purpose'
  | 'priority'
  | 'status'
  | 'department'
  | 'tags'
  | 'owner'
  | 'target_release'
  | 'estimated_hours'
  | 'actual_hours'
  | 'start_date'
  | 'end_date'
  | 'acceptance_criteria'
  | 'customer_impact'
  | 'business_value'
  | 'blockers'

/**
 * Field visibility configuration for progressive disclosure
 */
export interface FieldVisibilityConfig {
  /** Fields always visible in forms */
  essential: WorkItemField[]
  /** Fields shown when "Show more" is clicked */
  expanded: WorkItemField[]
}

/**
 * Work item types
 */
export type WorkItemType = 'concept' | 'feature' | 'bug'

/**
 * Workspace phases (4-phase system) - Updated 2025-12-13
 * - design (was research/planning)
 * - build (was execution)
 * - refine (was review)
 * - launch (was complete)
 */
export type WorkspacePhase = 'design' | 'build' | 'refine' | 'launch'

/**
 * Suggested action for quick actions panel
 */
export interface SuggestedAction {
  id: string
  label: string
  description: string
  icon: string
  type: 'create' | 'navigate' | 'dialog' | 'command'
  /** For navigate: URL, for dialog: dialog name, for command: command id */
  payload?: string
  /** Higher = more prominent */
  priority: number
  /** Optional badge text */
  badge?: string
}

/**
 * Dashboard widget identifiers
 */
export type DashboardWidget =
  | 'stats-grid'
  | 'phase-progress'
  | 'workspace-health'
  | 'recent-items'
  | 'quick-create'
  | 'onboarding'
  | 'activity-feed'
  | 'launch-countdown'
  | 'blockers-panel'
  | 'critical-path'
  | 'team-workload'
  | 'feedback-summary'
  | 'feature-requests'
  | 'analytics-overview'
  | 'bug-queue'
  | 'tech-debt'
  | 'stability-metrics'

/**
 * Extended mode configuration
 */
export interface ExtendedModeConfig {
  /** Default phase for new work items in this mode */
  defaultPhase: WorkspacePhase
  /** Default work item type when creating new items */
  defaultWorkItemType: WorkItemType
  /** Field visibility for progressive disclosure */
  visibleFields: FieldVisibilityConfig
  /** Quick actions suggested for this mode */
  suggestedActions: SuggestedAction[]
  /** Dashboard widgets to show in this mode */
  dashboardWidgets: DashboardWidget[]
  /** Priority order for dashboard widgets (lower = higher priority) */
  widgetPriority: Record<DashboardWidget, number>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Extended configuration for each workspace mode
 */
export const MODE_EXTENDED_CONFIG: Record<WorkspaceMode, ExtendedModeConfig> = {
  // -------------------------------------------------------------------------
  // DEVELOPMENT MODE - Building from scratch
  // -------------------------------------------------------------------------
  development: {
    defaultPhase: 'design',  // Was 'planning'
    defaultWorkItemType: 'feature',
    visibleFields: {
      essential: ['name', 'type', 'purpose'],
      expanded: [
        'priority',
        'department',
        'tags',
        'owner',
        'target_release',
        'estimated_hours',
        'acceptance_criteria',
      ],
    },
    suggestedActions: [
      {
        id: 'create-feature',
        label: 'Create Feature',
        description: 'Add a new feature to your roadmap',
        icon: 'sparkles',
        type: 'dialog',
        payload: 'create-work-item',
        priority: 1,
      },
      {
        id: 'create-mindmap',
        label: 'New Mind Map',
        description: 'Brainstorm ideas visually',
        icon: 'git-branch',
        type: 'navigate',
        payload: '/mind-maps/new',
        priority: 2,
      },
      {
        id: 'plan-timeline',
        label: 'Plan Timeline',
        description: 'Break down into MVP/SHORT/LONG',
        icon: 'calendar',
        type: 'navigate',
        payload: '?view=timeline',
        priority: 3,
      },
      {
        id: 'add-concept',
        label: 'Add Concept',
        description: 'Capture an unvalidated idea',
        icon: 'lightbulb',
        type: 'dialog',
        payload: 'create-work-item',
        priority: 4,
      },
    ],
    dashboardWidgets: [
      'stats-grid',
      'phase-progress',
      'workspace-health',
      'recent-items',
      'quick-create',
      'onboarding',
      'activity-feed',
    ],
    widgetPriority: {
      'stats-grid': 1,
      'phase-progress': 2,
      'workspace-health': 3,
      'recent-items': 4,
      'quick-create': 5,
      'onboarding': 6,
      'activity-feed': 7,
      'launch-countdown': 99,
      'blockers-panel': 99,
      'critical-path': 99,
      'team-workload': 99,
      'feedback-summary': 99,
      'feature-requests': 99,
      'analytics-overview': 99,
      'bug-queue': 99,
      'tech-debt': 99,
      'stability-metrics': 99,
    },
  },

  // -------------------------------------------------------------------------
  // LAUNCH MODE - Racing toward release
  // -------------------------------------------------------------------------
  launch: {
    defaultPhase: 'build',  // Was 'execution'
    defaultWorkItemType: 'bug',
    visibleFields: {
      essential: ['name', 'type', 'priority', 'status'],
      expanded: [
        'purpose',
        'department',
        'owner',
        'blockers',
        'start_date',
        'end_date',
        'tags',
      ],
    },
    suggestedActions: [
      {
        id: 'report-bug',
        label: 'Report Bug',
        description: 'Log a blocking issue',
        icon: 'bug',
        type: 'dialog',
        payload: 'create-work-item',
        priority: 1,
        badge: 'Critical',
      },
      {
        id: 'view-blockers',
        label: 'View Blockers',
        description: 'See what\'s blocking launch',
        icon: 'alert-triangle',
        type: 'navigate',
        payload: '?view=work-items&filter=blocked',
        priority: 2,
      },
      {
        id: 'check-timeline',
        label: 'Check Timeline',
        description: 'Review launch schedule',
        icon: 'calendar-check',
        type: 'navigate',
        payload: '?view=timeline',
        priority: 3,
      },
      {
        id: 'team-status',
        label: 'Team Status',
        description: 'See who\'s working on what',
        icon: 'users',
        type: 'navigate',
        payload: '?view=team',
        priority: 4,
      },
    ],
    dashboardWidgets: [
      'stats-grid',
      'workspace-health',
      'blockers-panel',
      'critical-path',
      'team-workload',
      'launch-countdown',
      'activity-feed',
    ],
    widgetPriority: {
      'stats-grid': 1,
      'workspace-health': 2,
      'blockers-panel': 3,
      'critical-path': 4,
      'team-workload': 5,
      'launch-countdown': 6,
      'activity-feed': 7,
      'phase-progress': 99,
      'recent-items': 99,
      'quick-create': 99,
      'onboarding': 99,
      'feedback-summary': 99,
      'feature-requests': 99,
      'analytics-overview': 99,
      'bug-queue': 99,
      'tech-debt': 99,
      'stability-metrics': 99,
    },
  },

  // -------------------------------------------------------------------------
  // GROWTH MODE - Iterating based on feedback
  // -------------------------------------------------------------------------
  growth: {
    defaultPhase: 'refine',  // Was 'review'
    defaultWorkItemType: 'feature', // Note: Set is_enhancement flag for iterations
    visibleFields: {
      essential: ['name', 'type', 'customer_impact'],
      expanded: [
        'priority',
        'purpose',
        'business_value',
        'department',
        'owner',
        'tags',
        'target_release',
      ],
    },
    suggestedActions: [
      {
        id: 'view-feedback',
        label: 'View Feedback',
        description: 'See what users are saying',
        icon: 'message-square',
        type: 'navigate',
        payload: '/feedback',
        priority: 1,
      },
      {
        id: 'create-enhancement',
        label: 'New Enhancement',
        description: 'Improve an existing feature',
        icon: 'zap',
        type: 'dialog',
        payload: 'create-work-item',
        priority: 2,
      },
      {
        id: 'check-analytics',
        label: 'Check Analytics',
        description: 'Review usage metrics',
        icon: 'bar-chart-3',
        type: 'navigate',
        payload: '?view=analytics',
        priority: 3,
      },
      {
        id: 'feature-requests',
        label: 'Feature Requests',
        description: 'See most requested features',
        icon: 'stars',
        type: 'navigate',
        payload: '/insights?filter=requests',
        priority: 4,
      },
    ],
    dashboardWidgets: [
      'stats-grid',
      'workspace-health',
      'feedback-summary',
      'feature-requests',
      'analytics-overview',
      'recent-items',
      'activity-feed',
    ],
    widgetPriority: {
      'stats-grid': 1,
      'workspace-health': 2,
      'feedback-summary': 3,
      'feature-requests': 4,
      'analytics-overview': 5,
      'recent-items': 6,
      'activity-feed': 7,
      'phase-progress': 99,
      'quick-create': 99,
      'onboarding': 99,
      'launch-countdown': 99,
      'blockers-panel': 99,
      'critical-path': 99,
      'team-workload': 99,
      'bug-queue': 99,
      'tech-debt': 99,
      'stability-metrics': 99,
    },
  },

  // -------------------------------------------------------------------------
  // MAINTENANCE MODE - Stability and sustainability
  // -------------------------------------------------------------------------
  maintenance: {
    defaultPhase: 'build',  // Was 'execution'
    defaultWorkItemType: 'bug',
    visibleFields: {
      essential: ['name', 'type', 'priority', 'status'],
      expanded: [
        'purpose',
        'blockers',
        'owner',
        'department',
        'actual_hours',
        'tags',
      ],
    },
    suggestedActions: [
      {
        id: 'report-bug',
        label: 'Report Bug',
        description: 'Log an issue to fix',
        icon: 'bug',
        type: 'dialog',
        payload: 'create-work-item',
        priority: 1,
      },
      {
        id: 'view-bugs',
        label: 'Bug Queue',
        description: 'See open bugs by priority',
        icon: 'list-todo',
        type: 'navigate',
        payload: '?view=work-items&type=bug',
        priority: 2,
      },
      {
        id: 'tech-debt',
        label: 'Tech Debt',
        description: 'Review technical debt items',
        icon: 'wrench',
        type: 'navigate',
        payload: '?view=work-items&tag=tech-debt',
        priority: 3,
      },
      {
        id: 'stability-report',
        label: 'Stability Report',
        description: 'Check system health',
        icon: 'activity',
        type: 'navigate',
        payload: '?view=analytics',
        priority: 4,
      },
    ],
    dashboardWidgets: [
      'stats-grid',
      'workspace-health',
      'bug-queue',
      'tech-debt',
      'stability-metrics',
      'recent-items',
      'activity-feed',
    ],
    widgetPriority: {
      'stats-grid': 1,
      'workspace-health': 2,
      'bug-queue': 3,
      'tech-debt': 4,
      'stability-metrics': 5,
      'recent-items': 6,
      'activity-feed': 7,
      'phase-progress': 99,
      'quick-create': 99,
      'onboarding': 99,
      'launch-countdown': 99,
      'blockers-panel': 99,
      'critical-path': 99,
      'team-workload': 99,
      'feedback-summary': 99,
      'feature-requests': 99,
      'analytics-overview': 99,
    },
  },
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get extended configuration for a mode
 */
export function getExtendedModeConfig(mode: WorkspaceMode): ExtendedModeConfig {
  return MODE_EXTENDED_CONFIG[mode]
}

/**
 * Get visible fields for a mode
 */
export function getModeVisibleFields(mode: WorkspaceMode): FieldVisibilityConfig {
  return MODE_EXTENDED_CONFIG[mode].visibleFields
}

/**
 * Get essential fields for a mode (always visible)
 */
export function getModeEssentialFields(mode: WorkspaceMode): WorkItemField[] {
  return MODE_EXTENDED_CONFIG[mode].visibleFields.essential
}

/**
 * Get expanded fields for a mode (shown on "Show more")
 */
export function getModeExpandedFields(mode: WorkspaceMode): WorkItemField[] {
  return MODE_EXTENDED_CONFIG[mode].visibleFields.expanded
}

/**
 * Check if a field is essential for a mode
 */
export function isFieldEssential(mode: WorkspaceMode, field: WorkItemField): boolean {
  return MODE_EXTENDED_CONFIG[mode].visibleFields.essential.includes(field)
}

/**
 * Check if a field is visible in a mode (either essential or expanded)
 */
export function isFieldVisible(mode: WorkspaceMode, field: WorkItemField): boolean {
  const config = MODE_EXTENDED_CONFIG[mode].visibleFields
  return config.essential.includes(field) || config.expanded.includes(field)
}

/**
 * Get suggested actions for a mode
 */
export function getModeSuggestedActions(mode: WorkspaceMode): SuggestedAction[] {
  return MODE_EXTENDED_CONFIG[mode].suggestedActions.sort((a, b) => a.priority - b.priority)
}

/**
 * Get dashboard widgets for a mode, sorted by priority
 */
export function getModeDashboardWidgets(mode: WorkspaceMode): DashboardWidget[] {
  const config = MODE_EXTENDED_CONFIG[mode]
  return [...config.dashboardWidgets].sort(
    (a, b) => config.widgetPriority[a] - config.widgetPriority[b]
  )
}

/**
 * Check if a widget should be shown for a mode
 */
export function shouldShowWidget(mode: WorkspaceMode, widget: DashboardWidget): boolean {
  return MODE_EXTENDED_CONFIG[mode].dashboardWidgets.includes(widget)
}

/**
 * Get the default work item type for a mode
 */
export function getModeDefaultWorkItemType(mode: WorkspaceMode): WorkItemType {
  return MODE_EXTENDED_CONFIG[mode].defaultWorkItemType
}

/**
 * Get the default phase for a mode
 */
export function getModeDefaultPhase(mode: WorkspaceMode): WorkspacePhase {
  return MODE_EXTENDED_CONFIG[mode].defaultPhase
}

/**
 * Get complete mode configuration (base + extended)
 */
export function getCompleteModeConfig(mode: WorkspaceMode) {
  return {
    ...WORKSPACE_MODE_CONFIG[mode],
    ...MODE_EXTENDED_CONFIG[mode],
  }
}
