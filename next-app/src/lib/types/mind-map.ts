/**
 * Mind Mapping Module Type Definitions
 * Week 3: Core types (AI fields will be added in Week 7)
 */

import { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react'

// Re-export ReactFlow types for convenience
export type { ReactFlowNode, ReactFlowEdge }

// ========== NODE TYPES ==========
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
  title: string
  description?: string
  position: {
    x: number
    y: number
  }
  data: Record<string, any>
  style?: Record<string, any>
  converted_to_work_item_id?: string
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
  title: string
  description?: string
  position: {
    x: number
    y: number
  }
}

export interface UpdateNodeRequest {
  title?: string
  description?: string
  position?: {
    x: number
    y: number
  }
  node_type?: NodeType
}

export interface CreateEdgeRequest {
  source_node_id: string
  target_node_id: string
  label?: string
}

export interface ConvertNodeToFeatureRequest {
  node_id: string
  timeline?: 'MVP' | 'SHORT' | 'LONG'
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
