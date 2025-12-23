/**
 * @deprecated This file is deprecated. Import from @/lib/types/work-items instead.
 *
 * This file now re-exports types from the new location for backward compatibility.
 * It will be removed in a future version.
 *
 * Migration guide:
 * - Old: `import type { WorkItem } from '@/lib/work-items/types'`
 * - New: `import type { WorkItem } from '@/lib/types/work-items'`
 *
 * Architecture note: Phase IS the status for work items (no separate status field).
 * Timeline items have separate status field for task execution tracking.
 */

// Re-export everything from new location
export type {
  WorkItem,
  WorkItemInsert,
  WorkItemUpdate,
  TimelineItem,
  TimelineItemInsert,
  TimelineItemUpdate,
  WorkItemWithRelations,
  FeaturePhase,
  ConceptPhase,
  BugPhase,
  EnhancementPhase,
  AnyWorkItemPhase,
  WorkItemType,
  TimelineItemStatus,
  WorkItemStatus, // deprecated - use AnyWorkItemPhase
  WorkItemPriority,
  TimelinePhase,
  DifficultyLevel,
  RelationshipType,
  ColumnVisibility,
  FilterState,
  ViewMode,
  TableSortConfig,
  TablePaginationConfig,
  BulkActionConfig,
} from '@/lib/types/work-items'

export {
  isWorkItemType,
  isValidPhase,
  isWorkItemPriority,
  isTimelinePhase,
  isDifficultyLevel,
  isRelationshipType,
  isTimelineItemStatus,
} from '@/lib/types/work-items'

// ============================================================================
// Legacy Types (Not yet migrated)
// ============================================================================

/**
 * Linked Item - Timeline item dependencies
 * TODO: Move this to @/lib/types/timeline-items.ts
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
   * - related_to: Alias for relates_to
   */
  relationship_type: 'blocks' | 'depends_on' | 'relates_to' | 'related_to'

  /** When this link was created */
  created_at?: string
}
