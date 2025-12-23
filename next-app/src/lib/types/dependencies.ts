/**
 * Dependencies Module Type Definitions
 * Week 4: Dependency graph and relationship management
 */

import { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react'
import type { WorkItem, AnyWorkItemPhase, WorkItemPriority } from './work-items'

// ========== CONNECTION TYPES ==========

/**
 * Work item-level connection types
 * From work_item_connections table schema
 */
export type ConnectionType =
  | 'dependency'    // Source depends on target
  | 'blocks'        // Source blocks target
  | 'enables'       // Source enables target
  | 'complements'   // Source complements target (synergy)
  | 'conflicts'     // Source conflicts with target
  | 'relates_to'    // Informational connection
  | 'duplicates'    // Source is duplicate of target
  | 'supersedes'    // Source replaces target

export interface ConnectionTypeConfig {
  type: ConnectionType
  label: string
  icon: string
  color: string
  description: string
  bidirectional: boolean
}

export const CONNECTION_TYPE_CONFIGS: Record<ConnectionType, ConnectionTypeConfig> = {
  dependency: {
    type: 'dependency',
    label: 'Depends On',
    icon: '🔗',
    color: '#f59e0b', // amber-500
    description: 'Source depends on target (source cannot start until target is done)',
    bidirectional: false,
  },
  blocks: {
    type: 'blocks',
    label: 'Blocks',
    icon: '🚫',
    color: '#ef4444', // red-500
    description: 'Source blocks target (target cannot start until source is done)',
    bidirectional: false,
  },
  enables: {
    type: 'enables',
    label: 'Enables',
    icon: '✅',
    color: '#10b981', // green-500
    description: 'Source enables target (target is unlocked after source)',
    bidirectional: false,
  },
  complements: {
    type: 'complements',
    label: 'Complements',
    icon: '🤝',
    color: '#8b5cf6', // purple-500
    description: 'Features work well together (synergy)',
    bidirectional: true,
  },
  conflicts: {
    type: 'conflicts',
    label: 'Conflicts',
    icon: '⚠️',
    color: '#dc2626', // red-600
    description: 'Features conflict with each other',
    bidirectional: true,
  },
  relates_to: {
    type: 'relates_to',
    label: 'Relates To',
    icon: '🔄',
    color: '#6b7280', // gray-500
    description: 'Informational connection (related but no dependency)',
    bidirectional: true,
  },
  duplicates: {
    type: 'duplicates',
    label: 'Duplicates',
    icon: '📋',
    color: '#fb923c', // orange-400
    description: 'Source is a duplicate of target',
    bidirectional: false,
  },
  supersedes: {
    type: 'supersedes',
    label: 'Supersedes',
    icon: '🔄',
    color: '#3b82f6', // blue-500
    description: 'Source replaces target (target is deprecated)',
    bidirectional: false,
  },
}

// ========== DATABASE TYPES ==========

/**
 * Work Item Connection - Database record
 * From work_item_connections table
 */
export interface WorkItemConnection {
  id: string
  user_id: string
  workspace_id: string
  source_work_item_id: string
  target_work_item_id: string
  connection_type: ConnectionType
  strength: number // 0.0 to 1.0
  is_bidirectional: boolean
  reason?: string
  evidence?: Record<string, any> // AI-generated supporting data
  confidence: number // 0.0 to 1.0
  discovered_by: 'user' | 'ai' | 'system' | 'correlation_engine'
  status: 'active' | 'inactive' | 'rejected' | 'pending_review'
  user_confirmed: boolean
  user_rejected: boolean
  created_at: string
  updated_at: string
}

/**
 * Work Item Connection with populated work items
 * Used for graph visualization
 */
export interface PopulatedWorkItemConnection extends WorkItemConnection {
  sourceWorkItem: WorkItem
  targetWorkItem: WorkItem
}

// ========== REACTFLOW TYPES ==========

/**
 * Work Item Node Data for ReactFlow
 */
export interface WorkItemNodeData extends Record<string, unknown> {
  workItem: WorkItem
  isOnCriticalPath: boolean
  dependencyCount: number
  dependentCount: number
  riskScore: number
}

/**
 * Dependency Edge Data for ReactFlow
 */
export interface DependencyEdgeData extends Record<string, unknown> {
  connection?: WorkItemConnection
  isOnCriticalPath?: boolean
  label?: string
}

export type DependencyGraphNode = ReactFlowNode<WorkItemNodeData>
export type DependencyGraphEdge = ReactFlowEdge<DependencyEdgeData>

// ========== API TYPES ==========

/**
 * Create connection request
 */
export interface CreateConnectionRequest {
  source_work_item_id: string
  target_work_item_id: string
  connection_type: ConnectionType
  reason?: string
  strength?: number // 0.0 to 1.0, defaults to 1.0
}

/**
 * Update connection request
 */
export interface UpdateConnectionRequest {
  connection_type?: ConnectionType
  reason?: string
  strength?: number
  status?: 'active' | 'inactive' | 'rejected' | 'pending_review'
}

/**
 * API response for list connections
 */
export interface ListConnectionsResponse {
  connections: WorkItemConnection[]
  totalCount: number
}

/**
 * API response for graph data
 */
export interface DependencyGraphResponse {
  nodes: WorkItemNodeData[]
  edges: DependencyEdgeData[]
}

// ========== CRITICAL PATH TYPES ==========

/**
 * Critical path analysis result
 */
export interface CriticalPathAnalysis {
  /** Work items on the critical path (ordered) */
  criticalPath: string[]

  /** Estimated total duration (in days) */
  totalDuration: number

  /** Bottleneck work items (most dependencies) */
  bottlenecks: Array<{
    workItemId: string
    workItemName: string
    dependencyCount: number
    dependentCount: number
    riskScore: number
  }>

  /** Work items with slack time (can be delayed without affecting total duration) */
  slackItems: Array<{
    workItemId: string
    workItemName: string
    slackDays: number
  }>

  /** Overall project health score (0-100) */
  healthScore: number
}

/**
 * Circular dependency detection result
 */
export interface CircularDependency {
  /** Cycle path (work item IDs) */
  cycle: string[]

  /** Cycle as work item names */
  cycleNames: string[]

  /** Suggested fix (which connection to remove) */
  suggestedFix: {
    connectionId: string
    sourceWorkItemName: string
    targetWorkItemName: string
    reason: string
  }
}

/**
 * Dependency health check result
 */
export interface DependencyHealthCheck {
  /** Circular dependencies found */
  circularDependencies: CircularDependency[]

  /** Orphaned work items (no connections) */
  orphanedWorkItems: string[]

  /** Conflicting dependencies */
  conflicts: Array<{
    workItemId: string
    workItemName: string
    conflictWith: string[]
    reason: string
  }>

  /** Overall health score (0-100) */
  healthScore: number
}

// ========== AI TYPES ==========

/**
 * AI dependency suggestion
 */
export interface DependencySuggestion {
  id: string
  source_work_item_id: string
  target_work_item_id: string
  connection_type: ConnectionType
  confidence: number // 0.0 to 1.0
  reason: string
  evidence: {
    sourceText: string
    targetText: string
    matchedKeywords: string[]
    semanticSimilarity: number
  }
  status: 'pending_review' | 'approved' | 'rejected'
}

/**
 * AI analysis request
 */
export interface AnalyzeDependenciesRequest {
  workspace_id: string
  work_item_ids?: string[] // Analyze specific work items, or all if omitted
  min_confidence?: number // Minimum confidence threshold (default: 0.7)
}

/**
 * AI analysis response
 */
export interface AnalyzeDependenciesResponse {
  suggestions: DependencySuggestion[]
  analyzed_count: number
  suggestions_count: number
}

// ========== LAYOUT TYPES ==========

/**
 * Graph layout algorithm
 */
export type LayoutAlgorithm = 'dagre' | 'force' | 'grid' | 'hierarchical'

/**
 * Graph layout direction (for dagre)
 */
export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL' // Top-Bottom, Bottom-Top, Left-Right, Right-Left

/**
 * Graph layout options
 */
export interface LayoutOptions {
  algorithm: LayoutAlgorithm
  direction?: LayoutDirection
  nodeSpacing?: number
  rankSpacing?: number
  edgeSpacing?: number
}

// ========== FILTER TYPES ==========

/**
 * Dependency graph filter state
 */
export interface DependencyFilterState {
  /** Search query (matches work item name) */
  search: string

  /** Filter by connection type */
  connectionTypes: ConnectionType[]

  /** Filter by work item phase */
  phases: AnyWorkItemPhase[]

  /** Filter by work item priority */
  priorities: WorkItemPriority[]

  /** Show only critical path */
  showOnlyCriticalPath: boolean

  /** Show only AI suggestions */
  showOnlyAiSuggestions: boolean

  /** Hide orphaned work items (no connections) */
  hideOrphans: boolean
}

// ========== EXPORT TYPES ==========

/**
 * Export dependency graph options
 */
export interface ExportDependencyGraphOptions {
  format: 'png' | 'svg' | 'json' | 'csv'
  filename?: string
  includeMetadata?: boolean
}

/**
 * Export dependency graph data (JSON format)
 */
export interface ExportDependencyGraphData {
  workspace_id: string
  exported_at: string
  connections: WorkItemConnection[]
  work_items: WorkItem[]
  critical_path: string[]
  health_score: number
  version: string
}

// ========== TYPE GUARDS ==========

/**
 * Type guard to check if a value is a valid ConnectionType
 */
export function isConnectionType(value: unknown): value is ConnectionType {
  return (
    typeof value === 'string' &&
    [
      'dependency',
      'blocks',
      'enables',
      'complements',
      'conflicts',
      'relates_to',
      'duplicates',
      'supersedes',
    ].includes(value)
  )
}

/**
 * Type guard to check if a value is a valid LayoutAlgorithm
 */
export function isLayoutAlgorithm(value: unknown): value is LayoutAlgorithm {
  return (
    typeof value === 'string' &&
    ['dagre', 'force', 'grid', 'hierarchical'].includes(value)
  )
}
