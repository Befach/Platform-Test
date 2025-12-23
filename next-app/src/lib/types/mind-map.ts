/**
 * Mind Mapping Module Type Definitions
 * Week 3: Core types (AI fields will be added in Week 7)
 */

import { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react'

// Re-export ReactFlow types for convenience
export type { ReactFlowNode, ReactFlowEdge }

// ========== CANVAS TYPES ==========
export type CanvasType = 'work_items_visualization' | 'freeform'

export interface CanvasTypeConfig {
  type: CanvasType
  label: string
  description: string
  icon: string
}

export const CANVAS_TYPE_CONFIGS: Record<CanvasType, CanvasTypeConfig> = {
  work_items_visualization: {
    type: 'work_items_visualization',
    label: 'Work Items Canvas',
    description: 'Auto-generated dependency graph with 4 view modes',
    icon: '🔗',
  },
  freeform: {
    type: 'freeform',
    label: 'Free-Form Mind Map',
    description: 'User-created canvas with shapes and work item references',
    icon: '🎨',
  },
}

// ========== SHAPE TYPES ==========
export type ShapeType =
  | 'semantic'            // Uses NodeType (idea, problem, solution, feature, question)
  | 'rectangle'           // Basic rectangle
  | 'circle'              // Circle/ellipse
  | 'sticky_note'         // Post-it style note
  | 'text'                // Plain text box (no border)
  | 'arrow'               // Directional arrow indicator
  | 'work_item_reference' // Links to a work item

export interface ShapeTypeConfig {
  type: ShapeType
  label: string
  icon: string
  description: string
  defaultWidth: number
  defaultHeight: number
  resizable: boolean
}

export const SHAPE_TYPE_CONFIGS: Record<ShapeType, ShapeTypeConfig> = {
  semantic: {
    type: 'semantic',
    label: 'Semantic Node',
    icon: '🏷️',
    description: 'Uses NodeType (idea, problem, solution, etc.)',
    defaultWidth: 150,
    defaultHeight: 100,
    resizable: true,
  },
  rectangle: {
    type: 'rectangle',
    label: 'Rectangle',
    icon: '▭',
    description: 'Basic rectangle shape',
    defaultWidth: 200,
    defaultHeight: 100,
    resizable: true,
  },
  circle: {
    type: 'circle',
    label: 'Circle',
    icon: '◯',
    description: 'Circle or ellipse shape',
    defaultWidth: 150,
    defaultHeight: 150,
    resizable: true,
  },
  sticky_note: {
    type: 'sticky_note',
    label: 'Sticky Note',
    icon: '📝',
    description: 'Post-it style note',
    defaultWidth: 180,
    defaultHeight: 180,
    resizable: true,
  },
  text: {
    type: 'text',
    label: 'Text Box',
    icon: '📄',
    description: 'Plain text (no border)',
    defaultWidth: 200,
    defaultHeight: 60,
    resizable: true,
  },
  arrow: {
    type: 'arrow',
    label: 'Arrow',
    icon: '➔',
    description: 'Directional arrow indicator',
    defaultWidth: 100,
    defaultHeight: 50,
    resizable: true,
  },
  work_item_reference: {
    type: 'work_item_reference',
    label: 'Work Item Reference',
    icon: '🔗',
    description: 'Links to a work item with live data',
    defaultWidth: 250,
    defaultHeight: 120,
    resizable: false, // Sized based on work item content
  },
}

// ========== NODE TYPES (Semantic) ==========
export type NodeType = 'idea' | 'problem' | 'solution' | 'feature' | 'question'

export interface NodeTypeConfig {
  type: NodeType
  label: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
  description: string
}

export const NODE_TYPE_CONFIGS: Record<NodeType, NodeTypeConfig> = {
  idea: {
    type: 'idea',
    label: 'Idea',
    icon: '💡',
    color: '#1e40af', // blue-800
    bgColor: '#dbeafe', // blue-100
    borderColor: '#3b82f6', // blue-500
    description: 'General concepts and brainstorming',
  },
  problem: {
    type: 'problem',
    label: 'Problem',
    icon: '⚠️',
    color: '#991b1b', // red-800
    bgColor: '#fee2e2', // red-100
    borderColor: '#ef4444', // red-500
    description: 'Pain points and challenges',
  },
  solution: {
    type: 'solution',
    label: 'Solution',
    icon: '✅',
    color: '#065f46', // green-800
    bgColor: '#d1fae5', // green-100
    borderColor: '#10b981', // green-500
    description: 'Approaches and resolutions',
  },
  feature: {
    type: 'feature',
    label: 'Feature',
    icon: '✨',
    color: '#5b21b6', // purple-800
    bgColor: '#ede9fe', // purple-100
    borderColor: '#8b5cf6', // purple-500
    description: 'Product features',
  },
  question: {
    type: 'question',
    label: 'Question',
    icon: '❓',
    color: '#92400e', // amber-800
    bgColor: '#fef3c7', // amber-100
    borderColor: '#f59e0b', // amber-500
    description: 'Open questions',
  },
}

// ========== DATABASE TYPES ==========
export interface MindMap {
  id: string
  team_id: string
  workspace_id: string
  user_id: string
  name: string
  description?: string
  canvas_type: CanvasType // NEW: Differentiates work_items vs freeform
  canvas_data: {
    zoom: number
    position: [number, number]
  }
  created_at: string
  updated_at: string
}

export interface MindMapNode {
  id: string
  mind_map_id: string
  team_id: string
  node_type: NodeType
  shape_type: ShapeType // NEW: Shape type for free-form canvases
  title: string
  description?: string
  position: {
    x: number
    y: number
  }
  width: number // NEW: Resizable width (default: 150)
  height: number // NEW: Resizable height (default: 100)
  data: Record<string, any>
  style?: Record<string, any>
  converted_to_work_item_id?: string
  referenced_work_item_id?: string // NEW: For work_item_reference nodes
  created_at: string
  updated_at: string
}

export interface MindMapEdge {
  id: string
  mind_map_id: string
  team_id: string
  source_node_id: string
  target_node_id: string
  edge_type?: string
  label?: string
  style?: Record<string, any>
  created_at: string
}

// ========== REACTFLOW TYPES ==========
export interface MindMapNodeData extends Record<string, unknown> {
  title: string
  description?: string
  nodeType: NodeType
  convertedToWorkItemId?: string
  mindMapNodeId?: string
  onEdit?: (nodeId: string) => void
  onDelete?: (nodeId: string) => void
  onConvert?: (nodeId: string) => void
}

export type MindMapReactFlowNode = ReactFlowNode<MindMapNodeData>
export type MindMapReactFlowEdge = ReactFlowEdge

// ========== API TYPES ==========
export interface CreateMindMapRequest {
  workspace_id: string
  name: string
  description?: string
  canvas_type?: CanvasType // Defaults to 'freeform'
  template?: 'product-ideation' | 'feature-planning' | 'user-journey'
}

export interface UpdateMindMapRequest {
  name?: string
  description?: string
  canvas_data?: {
    zoom: number
    position: [number, number]
  }
}

export interface CreateNodeRequest {
  node_type: NodeType
  shape_type?: ShapeType // Optional: defaults to 'semantic'
  title: string
  description?: string
  position: {
    x: number
    y: number
  }
  width?: number // Optional: uses SHAPE_TYPE_CONFIGS default
  height?: number // Optional: uses SHAPE_TYPE_CONFIGS default
  referenced_work_item_id?: string // Required if shape_type is 'work_item_reference'
}

export interface UpdateNodeRequest {
  title?: string
  description?: string
  position?: {
    x: number
    y: number
  }
  node_type?: NodeType
  shape_type?: ShapeType
  width?: number
  height?: number
  referenced_work_item_id?: string
}

export interface CreateEdgeRequest {
  source_node_id: string
  target_node_id: string
  label?: string
}

export interface ConvertNodeToWorkItemRequest {
  node_id: string
  work_item_type: 'concept' | 'feature' | 'bug'
  timeline?: 'MVP' | 'SHORT' | 'LONG'
  is_enhancement?: boolean
}

// ========== TEMPLATE TYPES ==========
export interface MindMapTemplate {
  id: string
  name: string
  description: string
  icon: string
  nodes: Omit<CreateNodeRequest, 'team_id' | 'mind_map_id'>[]
  edges: { source: number; target: number; label?: string }[] // indices into nodes array
}

// ========== EXPORT TYPES ==========
export interface ExportMindMapOptions {
  format: 'png' | 'json' | 'markdown'
  includeDescription?: boolean
  filename?: string
}

export interface MindMapExportData {
  mindMap: MindMap
  nodes: MindMapNode[]
  edges: MindMapEdge[]
  exportedAt: string
  version: string
}
