/**
 * BlockSuite MindMap TypeScript Types
 *
 * Types for BlockSuite v0.18.7 mindmap integration.
 * These types map to the internal BlockSuite mindmap APIs.
 */

/**
 * BlockSuite MindmapStyle enum values
 * Maps to @blocksuite/affine-model MindmapStyle
 */
export enum BlockSuiteMindmapStyle {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
}

/**
 * BlockSuite LayoutType enum values
 * Maps to @blocksuite/affine-model LayoutType
 */
export enum BlockSuiteLayoutType {
  RIGHT = 0,
  LEFT = 1,
  BALANCE = 2,
}

/**
 * Node structure for BlockSuite mindmap tree
 * Used with surface.addElement({ type: 'mindmap', children: tree })
 */
export interface BlockSuiteMindmapNode {
  /** Display text for the node */
  text: string
  /** Child nodes in the tree */
  children?: BlockSuiteMindmapNode[]
  /** Position and size: "x,y,width,height" format */
  xywh?: string
  /** Layout direction override for this branch */
  layoutType?: 'left' | 'right'
}

/**
 * Extended node with metadata for our application
 * Preserves semantic node type information
 */
export interface BlockSuiteMindmapNodeWithMeta extends BlockSuiteMindmapNode {
  /** Original semantic node type from our app */
  nodeType?: 'idea' | 'problem' | 'solution' | 'feature' | 'question'
  /** Original node ID for tracking */
  originalId?: string
  /** Custom metadata */
  data?: Record<string, unknown>
}

/**
 * Internal refs exposed by MindMapCanvas for external operations
 */
export interface MindMapCanvasRefs {
  /** Reference to the BlockSuite editor element */
  editor: unknown
  /** Reference to the BlockSuite Doc */
  doc: import("@blocksuite/store").Doc | null
  /** ID of the mindmap element in the surface */
  mindmapId: string | null
  /** ID of the surface block */
  surfaceId: string | null
}

/**
 * MindMapCanvas component props
 */
export interface MindMapCanvasProps {
  /** Document ID for persistence (optional) */
  documentId?: string
  /** Initial tree structure to render */
  initialTree?: BlockSuiteMindmapNode
  /** Visual style preset (1-4) */
  style?: BlockSuiteMindmapStyle
  /** Layout direction */
  layout?: BlockSuiteLayoutType
  /** Callback when tree structure changes */
  onTreeChange?: (tree: BlockSuiteMindmapNode) => void
  /** Callback when a node is selected */
  onNodeSelect?: (nodeId: string, text: string) => void
  /** Callback to expose internal refs for operations (used by MindMapCanvasWithToolbar) */
  onRefsReady?: (refs: MindMapCanvasRefs) => void
  /** Whether the canvas is read-only */
  readOnly?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Extended MindMapCanvas props with toolbar support
 */
export interface MindMapCanvasWithToolbarProps extends MindMapCanvasProps {
  /** Show the toolbar (default: true) */
  showToolbar?: boolean
  /** Toolbar position */
  toolbarPosition?: 'top' | 'bottom'
  /** Toolbar CSS classes */
  toolbarClassName?: string
}

/**
 * MindMap operation handlers exposed for external use
 */
export interface MindMapOperations {
  /** Add a child node to the specified parent */
  addChild: (parentNodeId: string) => void
  /** Add a sibling node next to the specified node */
  addSibling: (nodeId: string) => void
  /** Delete the specified node and its children */
  deleteNode: (nodeId: string) => void
  /** Undo the last operation */
  undo: () => void
  /** Redo the last undone operation */
  redo: () => void
}

/**
 * Result of converting ReactFlow data to BlockSuite format
 */
export interface ConversionResult {
  /** Root node of the tree */
  tree: BlockSuiteMindmapNode | null
  /** Nodes that couldn't be placed in the tree (orphaned) */
  orphanedNodes: string[]
  /** Any warnings during conversion */
  warnings: string[]
}

/**
 * Mindmap element returned from surface.getElementById()
 */
export interface MindmapElementRef {
  /** Element ID in the surface */
  id: string
  /** Current style */
  style: BlockSuiteMindmapStyle
  /** Tree structure access */
  tree?: {
    element: {
      xywh: string
    }
  }
}

/**
 * Surface block model interface (partial)
 * Represents the surface in edgeless mode
 */
export interface SurfaceBlockModelRef {
  /** Add a new element to the surface */
  addElement: (props: {
    type: 'mindmap' | 'shape' | 'connector' | 'brush' | 'text' | 'frame' | 'group'
    children?: BlockSuiteMindmapNode
    style?: BlockSuiteMindmapStyle
    [key: string]: unknown
  }) => string
  /** Get element by ID */
  getElementById: (id: string) => MindmapElementRef | null
}

// ============================================================
// Migration Types (Phase 3: Data Migration)
// ============================================================

/**
 * Migration status for mind map to BlockSuite conversion
 */
export type MigrationStatus =
  | 'pending'      // Not yet migrated
  | 'in_progress'  // Currently migrating
  | 'success'      // Migrated successfully
  | 'warning'      // Migrated with warnings (lost edges)
  | 'failed'       // Migration failed
  | 'skipped'      // Skipped (too large, invalid data)

/**
 * Lost edge record from DAG-to-tree conversion
 * BlockSuite trees cannot represent DAG structures (nodes with multiple parents)
 */
export interface LostEdge {
  /** Source node ID */
  sourceId: string
  /** Target node ID */
  targetId: string
  /** Source node title (for display) */
  sourceTitle?: string
  /** Target node title (for display) */
  targetTitle?: string
  /** Reason the edge was lost */
  reason: 'multiple_parents' | 'circular_reference' | 'orphaned_node'
}

/**
 * Migration options for controlling behavior
 */
export interface MigrationOptions {
  /** If true, validate and preview without saving (default: true for safety) */
  dryRun?: boolean
  /** Batch size for workspace migrations (default: 10) */
  batchSize?: number
  /** Maximum warnings per map before flagging (default: 50) */
  maxWarningsPerMap?: number
  /** If true, skip maps that exceed size threshold */
  skipLargeMaps?: boolean
  /** Maximum JSONB size in bytes before skipping (default: 100KB) */
  maxSizeBytes?: number
}

/**
 * Result of a single migration operation
 */
export interface MigrationResult {
  /** Mind map ID that was migrated */
  mindMapId: string
  /** Workspace ID containing the mind map */
  workspaceId: string
  /** Migration status after operation */
  status: MigrationStatus
  /** Number of source nodes */
  nodeCount: number
  /** Number of source edges */
  edgeCount: number
  /** Number of nodes in resulting tree */
  treeNodeCount: number
  /** Number of edges lost during DAG→Tree conversion */
  lostEdgeCount: number
  /** Warnings generated during migration */
  warnings: string[]
  /** Error message if failed */
  error?: string
  /** Duration of migration in milliseconds */
  durationMs: number
  /** Estimated size of JSONB tree in bytes */
  sizeBytes?: number
}

/**
 * Result of batch migration for multiple mind maps
 */
export interface BatchMigrationResult {
  /** Unique batch ID for tracking */
  batchId: string
  /** Total maps processed */
  totalMaps: number
  /** Successfully migrated count */
  successful: number
  /** Failed migration count */
  failed: number
  /** Skipped (already migrated or excluded) */
  skipped: number
  /** Migrated with warnings (lost edges) */
  withWarnings: number
  /** Individual results for each map */
  results: MigrationResult[]
  /** Batch start timestamp */
  startedAt: string
  /** Batch completion timestamp */
  completedAt: string
}

/**
 * Migration data stored with mind map in database
 */
export interface MindMapMigrationData {
  /** Converted BlockSuite tree structure */
  blocksuite_tree: BlockSuiteMindmapNode | null
  /** Current migration status */
  migration_status: MigrationStatus
  /** Warnings generated during migration */
  migration_warnings: string[]
  /** Count of edges lost during conversion */
  migration_lost_edges: number
  /** Timestamp of successful migration */
  migrated_at: string | null
  /** Estimated JSONB size in bytes */
  blocksuite_size_bytes: number | null
}

/**
 * Default sample tree for testing
 */
export const DEFAULT_SAMPLE_TREE: BlockSuiteMindmapNode = {
  text: 'Central Idea',
  children: [
    {
      text: 'Branch 1',
      children: [
        { text: 'Leaf 1.1' },
        { text: 'Leaf 1.2' },
      ],
    },
    {
      text: 'Branch 2',
      children: [
        { text: 'Leaf 2.1' },
      ],
    },
    {
      text: 'Branch 3',
    },
  ],
}
