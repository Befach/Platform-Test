/**
 * BlockSuite MindMap Conversion Utilities
 *
 * Utilities for converting between ReactFlow flat node/edge format
 * and BlockSuite's nested tree structure.
 */

import type { MindMapNode, MindMapEdge } from '@/lib/types/mind-map'
import type {
  BlockSuiteMindmapNode,
  BlockSuiteMindmapNodeWithMeta,
  ConversionResult,
} from './mindmap-types'

/**
 * Convert ReactFlow flat nodes and edges to BlockSuite tree structure
 *
 * ReactFlow uses flat arrays with edges defining relationships.
 * BlockSuite uses a nested tree structure.
 *
 * @param nodes - Array of ReactFlow nodes
 * @param edges - Array of edges connecting nodes
 * @returns ConversionResult with tree and any orphaned nodes
 */
export function reactFlowToBlockSuiteTree(
  nodes: MindMapNode[],
  edges: MindMapEdge[]
): ConversionResult {
  const warnings: string[] = []
  const orphanedNodes: string[] = []

  if (nodes.length === 0) {
    return { tree: null, orphanedNodes: [], warnings: [] }
  }

  // Build adjacency map: parent -> children
  const childrenMap = new Map<string, string[]>()
  const hasParent = new Set<string>()

  for (const edge of edges) {
    const sourceId = edge.source_node_id
    const targetId = edge.target_node_id

    if (!childrenMap.has(sourceId)) {
      childrenMap.set(sourceId, [])
    }
    childrenMap.get(sourceId)?.push(targetId)
    hasParent.add(targetId)
  }

  // Find root nodes (nodes without parents)
  const rootNodes = nodes.filter((node) => !hasParent.has(node.id))

  if (rootNodes.length === 0) {
    warnings.push('No root nodes found - possible circular references')
    // Try to find a node to use as root
    if (nodes.length > 0) {
      rootNodes.push(nodes[0])
      warnings.push(`Using first node "${nodes[0].title}" as root`)
    }
  }

  if (rootNodes.length > 1) {
    warnings.push(
      `Multiple root nodes found (${rootNodes.length}). Using first as primary, others as children.`
    )
  }

  // Create node lookup map
  const nodeMap = new Map<string, MindMapNode>()
  for (const node of nodes) {
    nodeMap.set(node.id, node)
  }

  // Track all processed nodes for orphan detection
  // NOTE: processedNodes is intentionally global across all roots.
  // Each node should only appear once in the final combined tree.
  // Orphan detection needs to track ALL processed nodes, not per-root.
  const processedNodes = new Set<string>()

  // Recursively build tree with cycle detection per traversal
  function buildTree(
    nodeId: string,
    depth = 0,
    currentPath = new Set<string>()
  ): BlockSuiteMindmapNodeWithMeta | null {
    // Prevent infinite loops (cycle detection within current traversal path)
    if (currentPath.has(nodeId)) {
      warnings.push(`Circular reference detected at node "${nodeId}"`)
      return null
    }

    // Track this node in current path and mark as processed
    const pathWithCurrent = new Set(currentPath).add(nodeId)
    processedNodes.add(nodeId)

    // Prevent too deep trees (safety limit)
    if (depth > 20) {
      warnings.push(`Tree depth limit (20) reached at node "${nodeId}"`)
      return null
    }

    const node = nodeMap.get(nodeId)
    if (!node) {
      orphanedNodes.push(nodeId)
      return null
    }

    const children: BlockSuiteMindmapNodeWithMeta[] = []
    const childIds = childrenMap.get(nodeId) || []

    for (const childId of childIds) {
      const childTree = buildTree(childId, depth + 1, pathWithCurrent)
      if (childTree) {
        children.push(childTree)
      }
    }

    // Convert position to xywh format
    const x = node.position?.x ?? 0
    const y = node.position?.y ?? 0
    const width = node.width ?? 150
    const height = node.height ?? 100
    const xywh = `${x},${y},${width},${height}`

    const result: BlockSuiteMindmapNodeWithMeta = {
      text: node.title || 'Untitled',
      xywh,
      nodeType: node.node_type,
      originalId: node.id,
      data: node.data,
    }

    if (children.length > 0) {
      result.children = children
    }

    return result
  }

  // Build tree from first root node
  const primaryRoot = rootNodes[0]
  const tree = buildTree(primaryRoot.id)

  // If we have multiple roots, add them as children of the primary
  if (rootNodes.length > 1 && tree) {
    const additionalRoots: BlockSuiteMindmapNodeWithMeta[] = []
    for (let i = 1; i < rootNodes.length; i++) {
      // Each additional root starts with a fresh path for cycle detection
      const additionalTree = buildTree(rootNodes[i].id, 0, new Set<string>())
      if (additionalTree) {
        additionalRoots.push(additionalTree)
      }
    }
    if (additionalRoots.length > 0) {
      tree.children = [...(tree.children || []), ...additionalRoots]
    }
  }

  // Find any truly orphaned nodes (not connected at all)
  for (const node of nodes) {
    if (!processedNodes.has(node.id)) {
      orphanedNodes.push(node.id)
      warnings.push(`Node "${node.title}" (${node.id}) is not connected to the tree`)
    }
  }

  return { tree, orphanedNodes, warnings }
}

/**
 * Convert BlockSuite tree back to ReactFlow flat format
 *
 * @param tree - BlockSuite tree structure
 * @returns Object with nodes and edges arrays
 */
export function blockSuiteTreeToReactFlow(
  tree: BlockSuiteMindmapNode
): { nodes: Partial<MindMapNode>[]; edges: Partial<MindMapEdge>[] } {
  const nodes: Partial<MindMapNode>[] = []
  const edges: Partial<MindMapEdge>[] = []
  let idCounter = Date.now()

  function traverse(
    node: BlockSuiteMindmapNode | BlockSuiteMindmapNodeWithMeta,
    parentId?: string
  ): string {
    const nodeId = (node as BlockSuiteMindmapNodeWithMeta).originalId || (idCounter++).toString()

    // Parse xywh if present
    let x = 0,
      y = 0,
      width = 150,
      height = 100
    if (node.xywh) {
      const parts = node.xywh.split(',').map(Number)
      if (parts.length >= 4) {
        ;[x, y, width, height] = parts
      }
    }

    const mindMapNode: Partial<MindMapNode> = {
      id: nodeId,
      title: node.text,
      position: { x, y },
      width,
      height,
      node_type: (node as BlockSuiteMindmapNodeWithMeta).nodeType || 'idea',
      data: (node as BlockSuiteMindmapNodeWithMeta).data || {},
    }

    nodes.push(mindMapNode)

    // Create edge from parent
    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source_node_id: parentId,
        target_node_id: nodeId,
      })
    }

    // Process children
    if (node.children) {
      for (const child of node.children) {
        traverse(child, nodeId)
      }
    }

    return nodeId
  }

  traverse(tree)

  return { nodes, edges }
}

/**
 * Convert a single semantic node to BlockSuite mindmap node
 *
 * @param node - MindMapNode from our database
 * @returns BlockSuiteMindmapNode
 */
export function semanticNodeToMindmapNode(node: MindMapNode): BlockSuiteMindmapNodeWithMeta {
  const x = node.position?.x ?? 0
  const y = node.position?.y ?? 0
  const width = node.width ?? 150
  const height = node.height ?? 100

  return {
    text: node.title,
    xywh: `${x},${y},${width},${height}`,
    nodeType: node.node_type,
    originalId: node.id,
    data: node.data,
  }
}

/**
 * Create a simple tree structure from text lines (markdown-like)
 *
 * @param text - Multi-line text with indentation representing hierarchy
 * @returns BlockSuiteMindmapNode tree
 *
 * @example
 * const tree = textToMindmapTree(`
 *   Central Idea
 *     Branch 1
 *       Leaf 1.1
 *     Branch 2
 * `)
 */
export function textToMindmapTree(text: string): BlockSuiteMindmapNode | null {
  const lines = text
    .split('\n')
    .map((line) => ({
      indent: line.search(/\S/),
      text: line.trim(),
    }))
    .filter((line) => line.text.length > 0 && line.indent >= 0)

  if (lines.length === 0) return null

  // Normalize indentation to use smallest non-zero indent as unit
  const indentUnit = Math.min(...lines.filter((l) => l.indent > 0).map((l) => l.indent)) || 2

  function buildFromLines(
    startIdx: number,
    baseIndent: number
  ): { node: BlockSuiteMindmapNode; endIdx: number } | null {
    if (startIdx >= lines.length) return null

    const line = lines[startIdx]
    if (line.indent < baseIndent) return null

    const node: BlockSuiteMindmapNode = {
      text: line.text,
      children: [],
    }

    let idx = startIdx + 1
    while (idx < lines.length) {
      const nextLine = lines[idx]
      if (nextLine.indent <= baseIndent) break

      // Direct child has indent exactly baseIndent + indentUnit
      if (nextLine.indent === baseIndent + indentUnit || nextLine.indent > baseIndent) {
        const childResult = buildFromLines(idx, nextLine.indent)
        if (childResult) {
          node.children?.push(childResult.node)
          idx = childResult.endIdx
        } else {
          idx++
        }
      } else {
        idx++
      }
    }

    if (node.children?.length === 0) {
      delete node.children
    }

    return { node, endIdx: idx }
  }

  const result = buildFromLines(0, lines[0].indent)
  return result?.node || null
}

/**
 * Calculate the depth of a mindmap tree
 *
 * @param tree - Root node of the tree
 * @returns Maximum depth of the tree
 */
export function getTreeDepth(tree: BlockSuiteMindmapNode): number {
  if (!tree.children || tree.children.length === 0) {
    return 1
  }
  return 1 + Math.max(...tree.children.map(getTreeDepth))
}

/**
 * Count total nodes in a mindmap tree
 *
 * @param tree - Root node of the tree
 * @returns Total number of nodes
 */
export function countTreeNodes(tree: BlockSuiteMindmapNode): number {
  if (!tree.children || tree.children.length === 0) {
    return 1
  }
  return 1 + tree.children.reduce((sum, child) => sum + countTreeNodes(child), 0)
}
