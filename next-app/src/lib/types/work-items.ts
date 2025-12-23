/**
 * Work Items Type Definitions
 *
 * Uses auto-generated Supabase types as single source of truth.
 * DO NOT create custom interfaces that duplicate database schema.
 *
 * Architecture Principle: Phase IS the status for work items.
 * Timeline items have separate status field for task execution tracking.
 */

import { Database } from '@/lib/supabase/database.types'

// ========== DATABASE TYPES ==========

/** Work Item - Complete database row */
export type WorkItem = Database['public']['Tables']['work_items']['Row']

/** Work Item Insert - For creating new work items */
export type WorkItemInsert = Database['public']['Tables']['work_items']['Insert']

/** Work Item Update - For updating work items */
export type WorkItemUpdate = Database['public']['Tables']['work_items']['Update']

/** Timeline Item - Complete database row */
export type TimelineItem = Database['public']['Tables']['timeline_items']['Row']

/** Timeline Item Insert */
export type TimelineItemInsert = Database['public']['Tables']['timeline_items']['Insert']

/** Timeline Item Update */
export type TimelineItemUpdate = Database['public']['Tables']['timeline_items']['Update']

// ========== LINKED ITEMS / DEPENDENCIES ==========

/**
 * Linked Item - Timeline item dependencies
 * @deprecated Will be moved to @/lib/types/dependencies.ts in future version
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

// ========== PHASE TYPES (Type-Aware) ==========

/**
 * Feature phases (design → build → refine → launch)
 */
export type FeaturePhase = 'design' | 'build' | 'refine' | 'launch'

/**
 * Concept phases (ideation → research → validated → rejected)
 */
export type ConceptPhase = 'ideation' | 'research' | 'validated' | 'rejected'

/**
 * Bug phases (triage → investigating → fixing → verified)
 */
export type BugPhase = 'triage' | 'investigating' | 'fixing' | 'verified'

/**
 * Enhancement phases (same as Feature)
 */
export type EnhancementPhase = FeaturePhase

/**
 * Union of all possible work item phases
 */
export type AnyWorkItemPhase = FeaturePhase | ConceptPhase | BugPhase

/**
 * Work item types
 */
export type WorkItemType = 'concept' | 'feature' | 'bug' | 'enhancement'

// ========== TIMELINE ITEM STATUS (Separate from Work Item Phase) ==========

/**
 * Timeline Item Status - Task execution tracking
 * This is SEPARATE from work item phase
 */
export type TimelineItemStatus =
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'on_hold'
  | 'cancelled'

// ========== LEGACY TYPES (For Backward Compatibility) ==========

/**
 * @deprecated Use AnyWorkItemPhase instead
 * Work item phase IS the status (no separate status field)
 */
export type WorkItemStatus = AnyWorkItemPhase

/**
 * Work Item Priority
 */
export type WorkItemPriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * Timeline Phase (MVP/SHORT/LONG breakdown)
 */
export type TimelinePhase = 'MVP' | 'SHORT' | 'LONG'

/**
 * Difficulty Level
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

/**
 * Relationship Type (for dependencies)
 */
export type RelationshipType = 'blocks' | 'depends_on' | 'relates_to' | 'related_to'

// ========== EXTENDED TYPES ==========

/**
 * Work Item with populated relationships
 * Use this when you need to join with other tables
 */
export interface WorkItemWithRelations extends WorkItem {
  workspace?: {
    id: string
    name: string
    icon: string | null
    phase: string
    team_id: string
  }
  assigned_to_user?: {
    id: string
    name: string | null
    email: string
  } | null
  timeline_items?: TimelineItem[]
  enhances?: WorkItem | null // Parent work item if is_enhancement=true
  enhancements?: WorkItem[] // Child enhancements
}

// ========== UI-SPECIFIC TYPES ==========

/**
 * Column Visibility Configuration
 */
export interface ColumnVisibility {
  type: boolean
  timeline: boolean
  phase: boolean // Changed from 'status' to 'phase'
  priority: boolean
  purpose: boolean
  integration: boolean
  tags: boolean
  links: boolean
  date: boolean
}

/**
 * Filter State
 */
export interface FilterState {
  search: string
  phase: string // Changed from 'status' to 'phase'
  priority: string
  type?: string
}

/**
 * View Mode
 */
export type ViewMode = 'collapsed' | 'expanded'

/**
 * Table Sort Configuration
 */
export interface TableSortConfig {
  column: keyof WorkItem | 'none'
  direction: 'asc' | 'desc'
}

/**
 * Pagination Configuration
 */
export interface TablePaginationConfig {
  currentPage: number
  pageSize: number
  totalItems: number
}

/**
 * Bulk Action Configuration
 */
export interface BulkActionConfig {
  selectedIds: Set<string>
  actions: Array<{
    id: string
    label: string
    icon?: string
    requiresConfirmation: boolean
    execute: (ids: string[]) => Promise<void>
  }>
}

// ========== TYPE GUARDS ==========

/**
 * Type guard to check if a value is a valid WorkItemType
 */
export function isWorkItemType(value: unknown): value is WorkItemType {
  return (
    typeof value === 'string' &&
    ['concept', 'feature', 'bug', 'enhancement'].includes(value)
  )
}

/**
 * Type guard to check if a value is a valid phase for a given work item type
 */
export function isValidPhase(type: WorkItemType, phase: unknown): phase is AnyWorkItemPhase {
  if (typeof phase !== 'string') return false

  switch (type) {
    case 'concept':
      return ['ideation', 'research', 'validated', 'rejected'].includes(phase)
    case 'feature':
    case 'enhancement':
      return ['design', 'build', 'refine', 'launch'].includes(phase)
    case 'bug':
      return ['triage', 'investigating', 'fixing', 'verified'].includes(phase)
    default:
      return false
  }
}

/**
 * Type guard for WorkItemPriority
 */
export function isWorkItemPriority(value: unknown): value is WorkItemPriority {
  return (
    typeof value === 'string' &&
    ['low', 'medium', 'high', 'critical'].includes(value)
  )
}

/**
 * Type guard for TimelinePhase
 */
export function isTimelinePhase(value: unknown): value is TimelinePhase {
  return typeof value === 'string' && ['MVP', 'SHORT', 'LONG'].includes(value)
}

/**
 * Type guard for DifficultyLevel
 */
export function isDifficultyLevel(value: unknown): value is DifficultyLevel {
  return typeof value === 'string' && ['easy', 'medium', 'hard'].includes(value)
}

/**
 * Type guard for RelationshipType
 */
export function isRelationshipType(value: unknown): value is RelationshipType {
  return (
    typeof value === 'string' &&
    ['blocks', 'depends_on', 'relates_to', 'related_to'].includes(value)
  )
}

/**
 * Type guard for TimelineItemStatus
 */
export function isTimelineItemStatus(value: unknown): value is TimelineItemStatus {
  return (
    typeof value === 'string' &&
    ['not_started', 'in_progress', 'blocked', 'completed', 'on_hold', 'cancelled'].includes(value)
  )
}
