/**
 * Features Table System - Central Export
 *
 * This barrel file exports all features table functionality for easy importing.
 * AI assistants can use these organized exports to understand the system structure.
 *
 * @module features
 */

// Configuration
export * from './table-config'
export {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  TIMELINE_PHASE_CONFIG,
  DIFFICULTY_CONFIG,
  DEFAULT_COLUMN_VISIBILITY,
  TABLE_PREFERENCES,
  FILTER_CONFIG,
  VIEW_MODE_CONFIG,
  getStatusConfig,
  getPriorityConfig,
  getTimelinePhaseConfig,
  getDifficultyConfig,
} from './table-config'

// Type Definitions
export * from './types'
export type {
  WorkItem,
  TimelineItem,
  LinkedItem,
  ColumnVisibility,
  FilterState,
  ViewMode,
  WorkItemStatus,
  WorkItemPriority,
  TimelinePhase,
  DifficultyLevel,
  RelationshipType,
  TableSortConfig,
  TablePaginationConfig,
  BulkActionConfig,
} from './types'

export {
  isWorkItemPriority,
  isTimelinePhase,
  isDifficultyLevel,
  isRelationshipType,
} from './types'

// Utility Functions
export * from './utils'
export {
  filterWorkItems,
  getTimelinesForWorkItem,
  calculateLinkedItemsCount,
  sortWorkItems,
  groupWorkItems,
  calculateWorkItemStats,
  generateTextId,
  formatDate,
  validateWorkItem,
  cloneWorkItem,
  mergeWorkItem,
  exportToCSV,
} from './utils'

// Test Data Generators
export * from './test-data'
export {
  generateTestWorkItem,
  generateTestWorkItems,
  generateTestTimelineItem,
  generateTestTimelines,
  generateTestLinkedItem,
  generateTestDataset,
  generateTestScenario,
} from './test-data'
