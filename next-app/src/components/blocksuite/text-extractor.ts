/**
 * Phase 5: Text Extractor for BlockSuite Mind Maps
 *
 * Extracts searchable text from BlockSuite JSONB trees with path context.
 * Works directly with mind_maps.blocksuite_tree column data.
 *
 * Architecture:
 * - Recursively walks the tree structure
 * - Preserves ancestor paths for context
 * - Computes tree statistics (depth, node count)
 * - Generates flat text for simple operations
 */

import type { BlockSuiteMindmapNode } from './mindmap-types'
import type {
  ExtractedTextNode,
  ExtractionResult,
  ExtractionOptions,
  TreeHashResult,
  TreeWalkCallback,
} from './rag-types'
import { createHash } from 'crypto'

// =============================================================================
// MAIN EXTRACTION FUNCTION
// =============================================================================

/**
 * Extract searchable text from BlockSuite JSONB tree
 * Works with mind_maps.blocksuite_tree column data
 *
 * @param tree - BlockSuite mindmap tree structure (can be null)
 * @param options - Extraction options
 * @returns Extraction result with nodes, flat text, and statistics
 *
 * @example
 * ```typescript
 * const result = extractTextFromBlockSuiteTree(mindMap.blocksuite_tree)
 * console.log(result.totalNodes) // 15
 * console.log(result.maxDepth) // 3
 * console.log(result.nodes[0].fullPath) // "Product Strategy"
 * ```
 */
export function extractTextFromBlockSuiteTree(
  tree: BlockSuiteMindmapNode | null,
  options: ExtractionOptions = {}
): ExtractionResult {
  const { maxDepth = Infinity, includeEmpty = false } = options

  // Handle null/undefined tree
  if (!tree) {
    return {
      nodes: [],
      flatText: '',
      totalNodes: 0,
      maxDepth: 0,
      extractedAt: new Date().toISOString(),
    }
  }

  let nodeCounter = 0
  let maxDepthFound = 0

  /**
   * Recursively walk the tree and extract nodes with paths
   */
  function walkNode(
    node: BlockSuiteMindmapNode,
    path: string[],
    depth: number
  ): ExtractedTextNode | null {
    // Respect max depth option
    if (depth > maxDepth) return null

    // Skip empty nodes unless includeEmpty is true
    if (!node.text && !includeEmpty) return null

    // Track max depth
    maxDepthFound = Math.max(maxDepthFound, depth)

    // Generate unique ID using timestamp pattern
    const nodeId = Date.now().toString() + '-' + nodeCounter++

    // Recursively process children
    const children = (node.children || [])
      .map((child) => walkNode(child, [...path, node.text], depth + 1))
      .filter((n): n is ExtractedTextNode => n !== null)

    // Determine node type based on position
    const nodeType: 'root' | 'branch' | 'leaf' =
      depth === 0 ? 'root' : children.length > 0 ? 'branch' : 'leaf'

    return {
      id: nodeId,
      text: node.text,
      path,
      fullPath: [...path, node.text].join(' > '),
      depth,
      nodeType,
      children,
      metadata: {
        xywh: node.xywh,
        layoutType: node.layoutType,
      },
    }
  }

  // Extract from root
  const root = walkNode(tree, [], 0)
  const nodes = root ? [root] : []

  // Generate flat text from all nodes
  const flatText = flattenText(nodes)

  // Count total nodes
  const totalNodes = countNodes(nodes)

  return {
    nodes,
    flatText,
    totalNodes,
    maxDepth: maxDepthFound,
    extractedAt: new Date().toISOString(),
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Flatten extracted nodes to a single string
 * Useful for simple text operations or indexing
 */
function flattenText(nodeList: ExtractedTextNode[]): string {
  return nodeList
    .map((n) => n.text + ' ' + flattenText(n.children))
    .join(' ')
    .trim()
}

/**
 * Count total nodes in extracted tree
 */
function countNodes(nodeList: ExtractedTextNode[]): number {
  return nodeList.reduce((sum, n) => sum + 1 + countNodes(n.children), 0)
}

// =============================================================================
// TREE WALKING UTILITIES
// =============================================================================

/**
 * Walk a BlockSuite tree and call callback for each node
 * Useful for custom traversal operations
 *
 * @param tree - BlockSuite mindmap tree
 * @param callback - Function called for each node (return false to stop)
 *
 * @example
 * ```typescript
 * const texts: string[] = []
 * walkBlockSuiteTree(tree, (node, path, depth) => {
 *   texts.push(node.text)
 * })
 * ```
 */
export function walkBlockSuiteTree(
  tree: BlockSuiteMindmapNode | null,
  callback: TreeWalkCallback
): void {
  if (!tree) return

  function walk(
    node: BlockSuiteMindmapNode,
    path: string[],
    depth: number
  ): boolean {
    // Call callback, stop if it returns false
    const result = callback(node, path, depth)
    if (result === false) return false

    // Recurse into children
    for (const child of node.children || []) {
      const shouldContinue = walk(child, [...path, node.text], depth + 1)
      if (!shouldContinue) return false
    }

    return true
  }

  walk(tree, [], 0)
}

/**
 * Get all text content from a subtree (node + descendants)
 * Includes optional path prefix for context
 *
 * @param node - Starting node
 * @param prefix - Optional prefix for the content
 * @returns Combined text of node and all descendants
 */
export function getSubtreeText(
  node: ExtractedTextNode,
  prefix: string = ''
): string {
  const nodeText = prefix ? `${prefix}: ${node.text}` : node.text
  const childTexts = node.children.map((child) =>
    getSubtreeText(child, node.fullPath)
  )
  return [nodeText, ...childTexts].join(' ')
}

// =============================================================================
// HASH COMPUTATION FOR CHANGE DETECTION
// =============================================================================

/**
 * Compute a hash of the tree content for change detection
 * Used to avoid re-embedding unchanged trees
 *
 * @param tree - BlockSuite mindmap tree
 * @returns Hash result with MD5 hash and statistics
 *
 * @example
 * ```typescript
 * const { hash, nodeCount } = computeTreeHash(mindMap.blocksuite_tree)
 * if (hash !== mindMap.last_embedded_hash) {
 *   // Tree has changed, re-embed
 * }
 * ```
 */
export function computeTreeHash(
  tree: BlockSuiteMindmapNode | null
): TreeHashResult {
  if (!tree) {
    return {
      hash: 'empty',
      nodeCount: 0,
      charCount: 0,
    }
  }

  let nodeCount = 0
  let charCount = 0
  const texts: string[] = []

  walkBlockSuiteTree(tree, (node, path, depth) => {
    nodeCount++
    charCount += node.text.length
    // Include path in hash to detect structural changes
    texts.push(`${depth}:${path.join('/')}:${node.text}`)
  })

  // Compute MD5 hash of all content
  const content = texts.join('\n')
  const hash = createHash('md5').update(content).digest('hex')

  return {
    hash,
    nodeCount,
    charCount,
  }
}

// =============================================================================
// TREE STATISTICS
// =============================================================================

/**
 * Get statistics about a BlockSuite tree
 * Useful for UI display and validation
 *
 * @param tree - BlockSuite mindmap tree
 * @returns Tree statistics
 */
export function getTreeStats(tree: BlockSuiteMindmapNode | null): {
  nodeCount: number
  maxDepth: number
  leafCount: number
  branchCount: number
  avgBranchingFactor: number
  totalChars: number
} {
  if (!tree) {
    return {
      nodeCount: 0,
      maxDepth: 0,
      leafCount: 0,
      branchCount: 0,
      avgBranchingFactor: 0,
      totalChars: 0,
    }
  }

  let nodeCount = 0
  let maxDepth = 0
  let leafCount = 0
  let branchCount = 0
  let totalChildren = 0
  let totalChars = 0

  walkBlockSuiteTree(tree, (node, _path, depth) => {
    nodeCount++
    maxDepth = Math.max(maxDepth, depth)
    totalChars += node.text.length

    const childCount = node.children?.length || 0
    if (childCount === 0) {
      leafCount++
    } else {
      branchCount++
      totalChildren += childCount
    }
  })

  return {
    nodeCount,
    maxDepth,
    leafCount,
    branchCount,
    avgBranchingFactor: branchCount > 0 ? totalChildren / branchCount : 0,
    totalChars,
  }
}

// =============================================================================
// TOKEN ESTIMATION
// =============================================================================

/**
 * Estimate token count for text
 * Uses ~4 chars per token approximation (OpenAI standard)
 *
 * @param text - Text to estimate
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Estimate total tokens for an extraction result
 *
 * @param extraction - Extraction result
 * @returns Estimated total tokens
 */
export function estimateExtractionTokens(extraction: ExtractionResult): number {
  return estimateTokens(extraction.flatText)
}
