/**
 * Feature Table Type Definitions
 *
 * Centralized type definitions for AI-assisted development.
 * All interfaces are well-documented for AI understanding.
 *
 * @module features/types
 */

/**
 * Work Item - Represents a feature, task, bug, epic, or story
 *
 * This is the main entity in the system. Work items can have multiple
 * timeline breakdowns (MVP, SHORT, LONG) and can be linked to other work items.
 */
export interface WorkItem {
  /** Unique identifier (timestamp-based TEXT, not UUID) */
  id: string

  /** Team ID for multi-tenancy (all queries must filter by this) */
  team_id?: string

  /** Workspace ID (project/product) */
  workspace_id?: string

  /** Display name of the work item */
  name: string

  /**
   * Type of work item
   * @example 'epic', 'feature', 'story', 'task', 'bug'
   */
  type: string

  /**
   * Description of what this work item accomplishes
   * @example 'Allow users to login with email and password'
   */
  purpose: string | null

  /**
   * Current status
   * @see STATUS_CONFIG in table-config.ts
   */
  status: WorkItemStatus

  /**
   * Priority level
   * @see PRIORITY_CONFIG in table-config.ts
   */
  priority: WorkItemPriority

  /**
   * Tags for categorization (e.g., 'backend', 'frontend', 'auth')
   * Enriched from work_item_tags join
   */
  tags: string[] | null

  /**
   * Count of linked work items (dependencies, related items)
   * Calculated from linked_items table
   */
  linkedItemsCount: number

  /** ISO 8601 timestamp */
  created_at: string

  /** ISO 8601 timestamp */
  updated_at: string

  /** User ID of creator */
  created_by: string
}

/**
 * Timeline Item - Represents a phase breakdown (MVP, SHORT, or LONG)
 *
 * Each work item can have up to 3 timeline items, one for each phase.
 * This allows breaking down a feature into incremental deliverables.
 */
export interface TimelineItem {
  /** Unique identifier */
  id: string

  /** Team ID for multi-tenancy */
  team_id?: string

  /** Workspace ID */
  workspace_id?: string

  /** Parent work item ID */
  work_item_id: string

  /**
   * Timeline phase
   * - MVP: Minimum Viable Product (core functionality)
   * - SHORT: Short-term enhancements (1-3 months)
   * - LONG: Long-term improvements (3+ months)
   */
  timeline: TimelinePhase

  /**
   * Description of what will be implemented in this phase
   * @example 'Basic login with email/password, no OAuth yet'
   */
  description: string | null

  /**
   * Current status of this timeline item
   * @example 'not_started', 'planning', 'in_progress', 'completed'
   */
  status?: string

  /**
   * Estimated difficulty level
   * @see DIFFICULTY_CONFIG in table-config.ts
   */
  difficulty: DifficultyLevel

  /**
   * External system to integrate with (optional)
   * @example 'Auth0', 'Stripe', 'Twilio'
   */
  integration_system?: string | null

  /**
   * Complexity of the integration (optional)
   * @example 'simple', 'moderate', 'complex'
   */
  integration_complexity?: string | null

  /**
   * High-level implementation approach (optional)
   * @example 'Use NextAuth.js with credentials provider'
   */
  implementation_approach?: string | null

  /**
   * Technologies/libraries to use (optional)
   * @example ['next-auth', 'bcrypt', 'prisma']
   */
  implementation_tech_stack?: string[] | null

  /**
   * Estimated time to complete (optional)
   * @example '2 weeks', '1 sprint', '40 hours'
   */
  implementation_estimated_duration?: string | null

  /** Sort order within the work item */
  order_index?: number

  /** ISO 8601 timestamp */
  created_at?: string
}

/**
 * Linked Item - Represents a relationship between two timeline items
 *
 * Links are created at the timeline level, but displayed at the work item level.
 * This allows showing "Feature A depends on Feature B" even though the actual
 * dependency might be "Feature A (MVP) depends on Feature B (MVP)".
 */
export interface LinkedItem {
  /** Unique identifier */
  id: string

  /** Team ID for multi-tenancy */
  team_id?: string

  /** Source timeline item ID */
  source_item_id: string

  /** Target timeline item ID */
  target_item_id: string

  /**
   * Type of relationship
   * - blocks: Source blocks target (target cannot start until source is done)
   * - depends_on: Source depends on target (source cannot start until target is done)
   * - relates_to: Source is related to target (informational only)
   */
  relationship_type: RelationshipType

  /** ISO 8601 timestamp */
  created_at?: string
}

/**
 * Column Visibility Configuration
 *
 * Controls which columns are displayed in the table.
 * Persisted to localStorage for user preference.
 */
export interface ColumnVisibility {
  /** Show work item type (epic, feature, task, etc.) */
  type: boolean

  /** Show timeline phases (MVP, SHORT, LONG) */
  timeline: boolean

  /** Show status (in progress, completed, etc.) */
  status: boolean

  /** Show priority (low, medium, high, critical) */
  priority: boolean

  /** Show purpose/description (hidden by default - long text) */
  purpose: boolean

  /** Show integration details (hidden by default - technical) */
  integration: boolean

  /** Show tags (backend, frontend, etc.) */
  tags: boolean

  /** Show linked items count */
  links: boolean

  /** Show created date (hidden by default - prefer relative dates in UI) */
  date: boolean
}

/**
 * Filter State
 *
 * Current filter values for the table.
 * Applied client-side after data is loaded from server.
 */
export interface FilterState {
  /** Search query (matches name, purpose, tags) */
  search: string

  /** Status filter ('all' or specific status value) */
  status: string

  /** Priority filter ('all' or specific priority value) */
  priority: string
}

/**
 * View Mode - How the table is displayed
 *
 * - collapsed: One row per work item, aggregated timeline info
 * - expanded: Parent rows with expandable child rows for timeline phases
 */
export type ViewMode = 'collapsed' | 'expanded'

/**
 * Work Item Status Values
 */
export type WorkItemStatus =
  | 'not_started'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'cancelled'

/**
 * Work Item Priority Values
 */
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * Timeline Phase Values
 */
export type TimelinePhase = 'MVP' | 'SHORT' | 'LONG'

/**
 * Difficulty Level Values
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

/**
 * Relationship Type Values
 */
export type RelationshipType = 'blocks' | 'depends_on' | 'relates_to'

/**
 * Table Sort Configuration
 */
export interface TableSortConfig {
  /** Column to sort by */
  column: keyof WorkItem | 'none'

  /** Sort direction */
  direction: 'asc' | 'desc'
}

/**
 * Pagination Configuration
 */
export interface TablePaginationConfig {
  /** Current page (1-indexed) */
  currentPage: number

  /** Items per page */
  pageSize: number

  /** Total number of items */
  totalItems: number
}

/**
 * Bulk Action Configuration
 */
export interface BulkActionConfig {
  /** Selected work item IDs */
  selectedIds: Set<string>

  /** Available bulk actions */
  actions: Array<{
    id: string
    label: string
    icon?: string
    requiresConfirmation: boolean
    execute: (ids: string[]) => Promise<void>
  }>
}

/**
 * Type guard to check if a value is a valid WorkItemStatus
 */
export function isWorkItemStatus(value: unknown): value is WorkItemStatus {
  return (
    typeof value === 'string' &&
    ['not_started', 'planned', 'in_progress', 'completed', 'on_hold', 'cancelled'].includes(value)
  )
}

/**
 * Type guard to check if a value is a valid WorkItemPriority
 */
export function isWorkItemPriority(value: unknown): value is WorkItemPriority {
  return (
    typeof value === 'string' && ['low', 'medium', 'high', 'critical'].includes(value)
  )
}

/**
 * Type guard to check if a value is a valid TimelinePhase
 */
export function isTimelinePhase(value: unknown): value is TimelinePhase {
  return typeof value === 'string' && ['MVP', 'SHORT', 'LONG'].includes(value)
}

/**
 * Type guard to check if a value is a valid DifficultyLevel
 */
export function isDifficultyLevel(value: unknown): value is DifficultyLevel {
  return typeof value === 'string' && ['easy', 'medium', 'hard'].includes(value)
}

/**
 * Type guard to check if a value is a valid RelationshipType
 */
export function isRelationshipType(value: unknown): value is RelationshipType {
  return (
    typeof value === 'string' &&
    ['blocks', 'depends_on', 'relates_to'].includes(value)
  )
}
