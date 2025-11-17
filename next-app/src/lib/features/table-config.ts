/**
 * Feature Table Configuration
 *
 * This configuration file centralizes all table-related settings for AI-assisted development.
 * AI assistants can easily modify table behavior by updating these configuration objects.
 *
 * @module table-config
 */

import {
  Circle,
  CircleDot,
  CheckCircle2,
  XCircle,
  PauseCircle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ChevronsUp,
} from 'lucide-react'

/**
 * Status configuration mapping status values to their display properties
 *
 * Usage: AI can add new statuses by adding entries to this object
 * Example: Add "blocked" status with red color and StopCircle icon
 */
export const STATUS_CONFIG = {
  not_started: {
    label: 'Not Started',
    icon: Circle,
    color: 'text-gray-500',
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  planned: {
    label: 'Planned',
    icon: Circle,
    color: 'text-purple-500',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-300',
  },
  in_progress: {
    label: 'In Progress',
    icon: CircleDot,
    color: 'text-blue-500',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-500',
    badgeColor: 'bg-green-100 text-green-700 border-green-300',
  },
  on_hold: {
    label: 'On Hold',
    icon: PauseCircle,
    color: 'text-orange-500',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-300',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-500',
    badgeColor: 'bg-red-100 text-red-700 border-red-300',
  },
} as const

/**
 * Priority configuration mapping priority values to their display properties
 *
 * Usage: AI can add new priorities (e.g., "urgent", "routine") here
 */
export const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    icon: ArrowDown,
    color: 'text-slate-500',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    sortOrder: 1,
  },
  medium: {
    label: 'Medium',
    icon: ArrowRight,
    color: 'text-blue-500',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-300',
    sortOrder: 2,
  },
  high: {
    label: 'High',
    icon: ArrowUp,
    color: 'text-orange-500',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-300',
    sortOrder: 3,
  },
  critical: {
    label: 'Critical',
    icon: ChevronsUp,
    color: 'text-red-500',
    badgeColor: 'bg-red-100 text-red-700 border-red-300',
    sortOrder: 4,
  },
} as const

/**
 * Timeline phase configuration
 *
 * Usage: AI can add new phases (e.g., "PROTOTYPE", "BETA") here
 */
export const TIMELINE_PHASE_CONFIG = {
  MVP: {
    label: 'MVP',
    color: 'bg-green-100 text-green-700 border-green-300',
    description: 'Minimum Viable Product - Core functionality',
    sortOrder: 1,
  },
  SHORT: {
    label: 'Short Term',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    description: 'Short-term enhancements (1-3 months)',
    sortOrder: 2,
  },
  LONG: {
    label: 'Long Term',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    description: 'Long-term improvements (3+ months)',
    sortOrder: 3,
  },
} as const

/**
 * Difficulty level configuration
 *
 * Usage: AI can modify difficulty levels or add new ones (e.g., "trivial", "impossible")
 */
export const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Easy',
    color: 'bg-green-100 text-green-700 border-green-300',
    estimatedHours: 8,
  },
  medium: {
    label: 'Medium',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    estimatedHours: 40,
  },
  hard: {
    label: 'Hard',
    color: 'bg-red-100 text-red-700 border-red-300',
    estimatedHours: 160,
  },
} as const

/**
 * Column visibility default configuration
 *
 * Usage: AI can modify which columns are visible by default
 * AI can add new columns by adding entries here and updating the table component
 */
export const DEFAULT_COLUMN_VISIBILITY = {
  type: true,
  timeline: true,
  status: true,
  priority: true,
  purpose: false, // Hidden by default - not commonly needed in list view
  integration: false, // Hidden by default - technical detail
  tags: true,
  links: true,
  date: false, // Hidden by default - prefer relative dates in UI
} as const

/**
 * Table display preferences
 *
 * Usage: AI can modify these to change table behavior globally
 */
export const TABLE_PREFERENCES = {
  defaultViewMode: 'collapsed' as const,
  maxTagsInRow: 2, // Show up to 2 tags, then "+N more"
  maxDescriptionLines: 2, // Line clamp for descriptions
  defaultSortColumn: 'created_at' as const,
  defaultSortDirection: 'desc' as const,
  rowsPerPage: 50,
  enableInfiniteScroll: false,
} as const

/**
 * Filter configuration
 *
 * Usage: AI can add new filter types or modify existing ones
 */
export const FILTER_CONFIG = {
  search: {
    placeholder: 'Filter tasks...',
    searchFields: ['name', 'purpose', 'tags'] as const,
    debounceMs: 300,
  },
  status: {
    label: 'Status',
    defaultValue: 'all',
  },
  priority: {
    label: 'Priority',
    defaultValue: 'all',
  },
} as const

/**
 * View mode configuration
 *
 * Usage: AI can add new view modes (e.g., "kanban", "calendar")
 */
export const VIEW_MODE_CONFIG = {
  collapsed: {
    label: 'Collapsed',
    description: 'Show one row per work item with aggregated timeline info',
    icon: 'List',
  },
  expanded: {
    label: 'Expanded',
    description: 'Show expandable rows with detailed timeline phases',
    icon: 'Maximize2',
  },
} as const

/**
 * Type-safe helper to get status configuration
 */
export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.not_started
}

/**
 * Type-safe helper to get priority configuration
 */
export function getPriorityConfig(priority: string) {
  return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium
}

/**
 * Type-safe helper to get timeline phase configuration
 */
export function getTimelinePhaseConfig(phase: string) {
  return TIMELINE_PHASE_CONFIG[phase as keyof typeof TIMELINE_PHASE_CONFIG]
}

/**
 * Type-safe helper to get difficulty configuration
 */
export function getDifficultyConfig(difficulty: string) {
  return DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medium
}

/**
 * AI Automation Instructions:
 *
 * To add a new status:
 * 1. Add entry to STATUS_CONFIG with icon, color, and badgeColor
 * 2. Update database enum if needed
 * 3. Update filter options in work-items-filter.tsx
 *
 * To add a new column:
 * 1. Add entry to DEFAULT_COLUMN_VISIBILITY
 * 2. Update ColumnVisibility interface in column-visibility-menu.tsx
 * 3. Add column rendering in features-table-view.tsx (both collapsed and expanded modes)
 * 4. Add header in TableHeader section
 *
 * To add a new filter:
 * 1. Add entry to FILTER_CONFIG
 * 2. Update FilterState interface in work-items-filter.tsx
 * 3. Add filter UI in work-items-filter.tsx
 * 4. Add filter logic in features-view-wrapper.tsx
 *
 * To modify table behavior:
 * 1. Update relevant entries in TABLE_PREFERENCES
 * 2. No code changes needed if using these constants
 */
