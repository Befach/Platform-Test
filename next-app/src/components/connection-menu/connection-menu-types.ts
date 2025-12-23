/**
 * Connection Menu Types
 *
 * Types for the Notion-style "/" connection menu.
 * Supports 6 entity types: Work Items, Members, Departments,
 * Strategies, Insights, and Resources.
 */

import { LucideIcon } from 'lucide-react'

// ============================================================================
// ENTITY TYPES
// ============================================================================

/**
 * Supported entity types for connections
 */
export type ConnectionEntityType =
  | 'work-item'
  | 'member'
  | 'department'
  | 'strategy'
  | 'insight'
  | 'resource'

/**
 * Base entity interface
 */
export interface ConnectionEntity {
  id: string
  type: ConnectionEntityType
  name: string
  description?: string
  icon?: string
  color?: string
  metadata?: Record<string, unknown>
}

/**
 * Work Item entity
 */
export interface WorkItemEntity extends ConnectionEntity {
  type: 'work-item'
  metadata: {
    itemType: 'concept' | 'feature' | 'bug'
    status: string
    phase: string
    priority?: string
    is_enhancement?: boolean
  }
}

/**
 * Member entity
 */
export interface MemberEntity extends ConnectionEntity {
  type: 'member'
  metadata: {
    email: string
    role: 'owner' | 'admin' | 'member' | 'viewer'
    avatarUrl?: string
  }
}

/**
 * Department entity
 */
export interface DepartmentEntity extends ConnectionEntity {
  type: 'department'
  metadata: {
    workItemCount: number
  }
}

/**
 * Strategy entity (OKR/Pillar)
 */
export interface StrategyEntity extends ConnectionEntity {
  type: 'strategy'
  metadata: {
    strategyType: 'vision' | 'pillar' | 'objective' | 'key_result'
    progress?: number
    status?: string
    parentId?: string
  }
}

/**
 * Insight entity (Customer feedback)
 */
export interface InsightEntity extends ConnectionEntity {
  type: 'insight'
  metadata: {
    insightType: 'feedback' | 'request' | 'bug_report' | 'complaint' | 'praise' | 'question'
    source?: string
    sentiment?: 'positive' | 'neutral' | 'negative'
    votes?: number
  }
}

/**
 * Resource entity
 */
export interface ResourceEntity extends ConnectionEntity {
  type: 'resource'
  metadata: {
    resourceType: 'document' | 'link' | 'image' | 'file' | 'figma' | 'github' | 'notion' | 'other'
    url?: string
    version?: number
  }
}

/**
 * Union type for all entity types
 */
export type AnyConnectionEntity =
  | WorkItemEntity
  | MemberEntity
  | DepartmentEntity
  | StrategyEntity
  | InsightEntity
  | ResourceEntity

// ============================================================================
// ENTITY TYPE CONFIG
// ============================================================================

/**
 * Configuration for each entity type
 */
export interface EntityTypeConfig {
  type: ConnectionEntityType
  label: string
  labelPlural: string
  icon: string
  color: string
  description: string
  shortcut: string
}

/**
 * Entity type configurations
 */
export const ENTITY_TYPE_CONFIG: Record<ConnectionEntityType, EntityTypeConfig> = {
  'work-item': {
    type: 'work-item',
    label: 'Work Item',
    labelPlural: 'Work Items',
    icon: 'list-todo',
    color: '#6366f1',
    description: 'Features, bugs, concepts, enhancements',
    shortcut: 'w',
  },
  member: {
    type: 'member',
    label: 'Member',
    labelPlural: 'Members',
    icon: 'user',
    color: '#8b5cf6',
    description: 'Team members and collaborators',
    shortcut: '@',
  },
  department: {
    type: 'department',
    label: 'Department',
    labelPlural: 'Departments',
    icon: 'building-2',
    color: '#10b981',
    description: 'Teams and organizational units',
    shortcut: 'd',
  },
  strategy: {
    type: 'strategy',
    label: 'Strategy',
    labelPlural: 'Strategies',
    icon: 'target',
    color: '#f59e0b',
    description: 'OKRs, pillars, objectives',
    shortcut: 's',
  },
  insight: {
    type: 'insight',
    label: 'Insight',
    labelPlural: 'Insights',
    icon: 'lightbulb',
    color: '#ec4899',
    description: 'Customer feedback and requests',
    shortcut: 'i',
  },
  resource: {
    type: 'resource',
    label: 'Resource',
    labelPlural: 'Resources',
    icon: 'paperclip',
    color: '#3b82f6',
    description: 'Documents, links, files',
    shortcut: 'r',
  },
}

// ============================================================================
// MENU TYPES
// ============================================================================

/**
 * Connection menu props
 */
export interface ConnectionMenuProps {
  /** Team ID for scoping entities */
  teamId: string
  /** Workspace ID (optional, for workspace-scoped entities) */
  workspaceId?: string
  /** Whether the menu is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when an entity is selected */
  onSelect: (entity: AnyConnectionEntity) => void
  /** Entity types to include (default: all) */
  enabledTypes?: ConnectionEntityType[]
  /** Optional trigger element (default: "/" button) */
  trigger?: React.ReactNode
  /** Anchor element for positioning */
  anchorEl?: HTMLElement | null
}

/**
 * Connection menu state
 */
export interface ConnectionMenuState {
  search: string
  activeType: ConnectionEntityType | 'all'
  results: AnyConnectionEntity[]
  loading: boolean
  error: string | null
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

/**
 * Search options for the connection menu
 */
export interface ConnectionSearchOptions {
  query: string
  teamId: string
  workspaceId?: string
  types?: ConnectionEntityType[]
  limit?: number
}

/**
 * Search results grouped by type
 */
export interface ConnectionSearchResults {
  'work-item': WorkItemEntity[]
  member: MemberEntity[]
  department: DepartmentEntity[]
  strategy: StrategyEntity[]
  insight: InsightEntity[]
  resource: ResourceEntity[]
}
