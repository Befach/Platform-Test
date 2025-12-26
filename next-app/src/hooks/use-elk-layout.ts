/**
 * ELK.js Layout Hook for Unified Canvas
 *
 * Hierarchical graph layout using Eclipse Layout Kernel (ELK.js)
 * - Always enabled, no mode switching
 * - Tracks layout time for performance monitoring
 * - Supports incremental updates
 * - Works with ReactFlow nodes and edges
 */

import { useCallback, useEffect, useState } from 'react'
import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js'
import { Node, Edge, Position } from '@xyflow/react'

export interface LayoutOptions {
  direction?: 'DOWN' | 'RIGHT' | 'UP' | 'LEFT'
  nodeSpacing?: number
  levelSpacing?: number
  edgeSpacing?: number
}

export interface LayoutResult {
  nodes: Node[]
  edges: Edge[]
  layoutTime: number
  isLayouting: boolean
}

const elk = new ELK()

// Default ELK.js configuration for hierarchical layout
const DEFAULT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.edgeNode': '50',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.edgeRouting': 'ORTHOGONAL',
}

/**
 * Convert ReactFlow nodes to ELK.js nodes
 */
function toElkNodes(nodes: Node[]): ElkNode['children'] {
  return nodes.map((node) => ({
    id: node.id,
    width: node.width ?? 280,
    height: node.height ?? 120,
  }))
}

/**
 * Convert ReactFlow edges to ELK.js edges
 */
function toElkEdges(edges: Edge[]): ElkExtendedEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }))
}

/**
 * Convert ELK.js layout result back to ReactFlow nodes
 */
function fromElkNodes(
  elkChildren: ElkNode['children'] = [],
  originalNodes: Node[]
): Node[] {
  return elkChildren.map((elkNode) => {
    const originalNode = originalNodes.find((n) => n.id === elkNode.id)

    if (!originalNode) {
      throw new Error(`Node ${elkNode.id} not found in original nodes`)
    }

    return {
      ...originalNode,
      position: { x: elkNode.x ?? 0, y: elkNode.y ?? 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }
  })
}

/**
 * Hook to compute ELK.js hierarchical layout for ReactFlow
 *
 * @param nodes - ReactFlow nodes to layout
 * @param edges - ReactFlow edges to layout
 * @param options - Layout configuration options
 * @param onLayoutTimeChange - Callback with layout computation time
 *
 * @returns Layouted nodes, edges, layout time, and loading state
 */
export function useElkLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {},
  onLayoutTimeChange?: (time: number) => void
): LayoutResult {
  const [layoutedNodes, setLayoutedNodes] = useState<Node[]>(nodes)
  const [layoutedEdges, setLayoutedEdges] = useState<Edge[]>(edges)
  const [layoutTime, setLayoutTime] = useState(0)
  const [isLayouting, setIsLayouting] = useState(false)

  // Track previous node/edge IDs to detect actual changes
  const [prevNodeIds, setPrevNodeIds] = useState<string>('')
  const [prevEdgeIds, setPrevEdgeIds] = useState<string>('')

  const computeLayout = useCallback(
    async (nodesToLayout: Node[], edgesToLayout: Edge[]) => {
      if (nodesToLayout.length === 0) {
        return { nodes: [], edges: [] }
      }

      const startTime = performance.now()
      setIsLayouting(true)

      try {
        const elkOptions = {
          ...DEFAULT_OPTIONS,
          'elk.direction': options.direction ?? 'DOWN',
          'elk.spacing.nodeNode': String(options.nodeSpacing ?? 80),
          'elk.layered.spacing.nodeNodeBetweenLayers': String(options.levelSpacing ?? 100),
          'elk.spacing.edgeNode': String(options.edgeSpacing ?? 50),
        }

        const elkGraph: ElkNode = {
          id: 'root',
          layoutOptions: elkOptions,
          children: toElkNodes(nodesToLayout),
          edges: toElkEdges(edgesToLayout),
        }

        const layouted = await elk.layout(elkGraph)
        const newNodes = fromElkNodes(layouted.children, nodesToLayout)

        const endTime = performance.now()
        const computeTime = endTime - startTime

        setLayoutTime(computeTime)
        if (onLayoutTimeChange) {
          onLayoutTimeChange(computeTime)
        }

        return { nodes: newNodes, edges: edgesToLayout }
      } catch (error) {
        console.error('[useElkLayout] Layout computation failed:', error)
        return { nodes: nodesToLayout, edges: edgesToLayout }
      } finally {
        setIsLayouting(false)
      }
    },
    [options, onLayoutTimeChange]
  )

  useEffect(() => {
    // Create fingerprint of current nodes/edges to detect actual changes
    // Use localeCompare for consistent string sorting across browsers
    const currentNodeIds = nodes.map(n => n.id).sort((a, b) => a.localeCompare(b)).join(',')
    const currentEdgeIds = edges.map(e => `${e.source}-${e.target}`).sort((a, b) => a.localeCompare(b)).join(',')

    // Only recompute if nodes/edges have actually changed
    if (currentNodeIds === prevNodeIds && currentEdgeIds === prevEdgeIds) {
      return
    }

    setPrevNodeIds(currentNodeIds)
    setPrevEdgeIds(currentEdgeIds)

    let cancelled = false

    computeLayout(nodes, edges).then(({ nodes: newNodes, edges: newEdges }) => {
      if (!cancelled) {
        setLayoutedNodes(newNodes)
        setLayoutedEdges(newEdges)
      }
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]) // Only recompute when nodes/edges actually change

  return {
    nodes: layoutedNodes,
    edges: layoutedEdges,
    layoutTime,
    isLayouting,
  }
}

/**
 * Manually trigger layout computation (for imperative usage)
 *
 * @param nodes - Nodes to layout
 * @param edges - Edges to layout
 * @param options - Layout options
 *
 * @returns Promise with layouted nodes and edges
 */
export async function computeElkLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[]; layoutTime: number }> {
  if (nodes.length === 0) {
    return { nodes: [], edges: [], layoutTime: 0 }
  }

  const startTime = performance.now()

  const elkOptions = {
    ...DEFAULT_OPTIONS,
    'elk.direction': options.direction ?? 'DOWN',
    'elk.spacing.nodeNode': String(options.nodeSpacing ?? 80),
    'elk.layered.spacing.nodeNodeBetweenLayers': String(options.levelSpacing ?? 100),
    'elk.spacing.edgeNode': String(options.edgeSpacing ?? 50),
  }

  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: elkOptions,
    children: toElkNodes(nodes),
    edges: toElkEdges(edges),
  }

  try {
    const layouted = await elk.layout(elkGraph)
    const layoutedNodes = fromElkNodes(layouted.children, nodes)
    const endTime = performance.now()
    const layoutTime = endTime - startTime

    return { nodes: layoutedNodes, edges, layoutTime }
  } catch (error) {
    console.error('[computeElkLayout] Layout computation failed:', error)
    return { nodes, edges, layoutTime: 0 }
  }
}
