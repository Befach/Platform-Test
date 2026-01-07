/**
 * Phase 5: Mind Map Chunker for Embedding
 *
 * Chunks mind map content for embedding with path-preserving context.
 * Creates 300-token chunks optimized for RAG retrieval.
 *
 * Strategy:
 * - Path-preserving subtree chunks (prepend ancestor path)
 * - 300 token target (research-backed optimal size)
 * - Limit to 3 ancestors in path prefix (avoid bloat)
 * - Skip tiny nodes (<50 tokens) - collapse into parent
 *
 * Research backing:
 * - NVIDIA 2024: 256-512 tokens optimal for factoid queries
 * - Chroma: 400 tokens yields 88-89% recall
 * - Our target: 300 tokens (mind maps are shorter content)
 */

import type { ExtractionResult, ExtractedTextNode } from './rag-types'
import type { MindMapChunkForEmbedding, ChunkOptions, MindMapChunkMetadata } from './rag-types'
import { estimateTokens, getSubtreeText } from './text-extractor'

// =============================================================================
// DEFAULT OPTIONS
// =============================================================================

/**
 * Default chunking options (research-backed values)
 */
export const DEFAULT_CHUNK_OPTIONS: Required<ChunkOptions> = {
  maxTokensPerChunk: 300,   // Research: 256-512 optimal, 300 for mind maps
  minChunkSize: 50,         // Skip tiny fragments
  includePathContext: true, // Always include path for context
  maxPathDepth: 3,          // Limit ancestors in prefix
}

// =============================================================================
// MAIN CHUNKING FUNCTION
// =============================================================================

/**
 * Chunk mind map tree for embedding with path context
 * Strategy: Path-preserving subtree chunks (300 tokens target)
 *
 * @param extraction - Result from extractTextFromBlockSuiteTree()
 * @param mindMapId - Mind map ID for metadata
 * @param options - Chunking options
 * @returns Array of chunks ready for embedding API
 *
 * @example
 * ```typescript
 * const extraction = extractTextFromBlockSuiteTree(tree)
 * const chunks = chunkMindmapForEmbedding(extraction, mindMapId)
 *
 * // Each chunk has content like:
 * // "Product Strategy > Goals > Revenue: Increase revenue by 20%..."
 * ```
 */
export function chunkMindmapForEmbedding(
  extraction: ExtractionResult,
  mindMapId: string,
  options: ChunkOptions = {}
): MindMapChunkForEmbedding[] {
  const opts = { ...DEFAULT_CHUNK_OPTIONS, ...options }
  const {
    maxTokensPerChunk,
    minChunkSize,
    includePathContext,
    maxPathDepth,
  } = opts

  const chunks: MindMapChunkForEmbedding[] = []
  let chunkIndex = 0

  /**
   * Process a single node and decide whether to:
   * 1. Chunk entire subtree (if fits)
   * 2. Chunk node alone and recurse children
   * 3. Skip (if too small, will be included in parent)
   */
  function processNode(node: ExtractedTextNode): void {
    // Build chunk content with path context
    const pathContext = includePathContext
      ? getPathContext(node.path, maxPathDepth)
      : ''
    const contextPrefix = pathContext ? `${pathContext} > ` : ''

    // Get full subtree text with context
    const subtreeText = getSubtreeTextWithContext(node, contextPrefix)
    const subtreeTokens = estimateTokens(subtreeText)

    // Decision: Chunk entire subtree or recurse?
    if (subtreeTokens <= maxTokensPerChunk && subtreeTokens >= minChunkSize) {
      // Subtree fits in one chunk - create chunk with full subtree
      chunks.push({
        content: subtreeText,
        index: chunkIndex++,
        heading: node.text,
        metadata: {
          mindMapId,
          path: node.path,
          nodeType: node.nodeType,
          depth: node.depth,
          source: 'blocksuite_mindmap',
        },
      })
    } else if (subtreeTokens > maxTokensPerChunk) {
      // Subtree too large - chunk this node, recurse children
      const nodeText = contextPrefix + node.text
      const nodeTokens = estimateTokens(nodeText)

      if (nodeTokens >= minChunkSize) {
        chunks.push({
          content: nodeText,
          index: chunkIndex++,
          heading: node.text,
          metadata: {
            mindMapId,
            path: node.path,
            nodeType: node.nodeType,
            depth: node.depth,
            source: 'blocksuite_mindmap',
          },
        })
      }

      // Recurse into children
      for (const child of node.children) {
        processNode(child)
      }
    }
    // Skip if too small (will be included in parent's chunk)
  }

  // Process all root nodes
  for (const node of extraction.nodes) {
    processNode(node)
  }

  return chunks
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get last N ancestors for path context
 * Limits prefix to avoid excessive context bloat
 *
 * @param path - Full ancestor path
 * @param maxDepth - Maximum ancestors to include
 * @returns Path context string
 */
function getPathContext(path: string[], maxDepth: number): string {
  const ancestors = path.slice(-maxDepth)
  return ancestors.length > 0 ? ancestors.join(' > ') : ''
}

/**
 * Get all text in a subtree with context prefix
 * Recursively combines node text with children
 *
 * @param node - Starting node
 * @param prefix - Context prefix to prepend
 * @returns Combined text of node and all descendants
 */
function getSubtreeTextWithContext(
  node: ExtractedTextNode,
  prefix: string
): string {
  const nodeText = prefix ? `${prefix}${node.text}` : node.text

  if (node.children.length === 0) {
    return nodeText
  }

  // Include children with their paths
  const childTexts = node.children.map((child) => {
    const childPrefix = `${prefix}${node.text} > `
    return getSubtreeTextWithContext(child, childPrefix)
  })

  return [nodeText, ...childTexts].join(' ')
}

// =============================================================================
// BATCH CHUNKING
// =============================================================================

/**
 * Chunk multiple mind maps in batch
 * Useful for workspace-level embedding jobs
 *
 * @param extractions - Array of extraction results with IDs
 * @param options - Chunking options
 * @returns All chunks with mind map IDs in metadata
 */
export function batchChunkMindmaps(
  extractions: Array<{ mindMapId: string; extraction: ExtractionResult }>,
  options: ChunkOptions = {}
): MindMapChunkForEmbedding[] {
  const allChunks: MindMapChunkForEmbedding[] = []

  for (const { mindMapId, extraction } of extractions) {
    const chunks = chunkMindmapForEmbedding(extraction, mindMapId, options)
    allChunks.push(...chunks)
  }

  return allChunks
}

// =============================================================================
// CHUNK STATISTICS
// =============================================================================

/**
 * Get statistics about chunking result
 * Useful for monitoring and debugging
 */
export function getChunkStats(chunks: MindMapChunkForEmbedding[]): {
  totalChunks: number
  totalTokens: number
  avgTokensPerChunk: number
  minTokens: number
  maxTokens: number
  chunksByType: Record<string, number>
  chunksByDepth: Record<number, number>
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      totalTokens: 0,
      avgTokensPerChunk: 0,
      minTokens: 0,
      maxTokens: 0,
      chunksByType: {},
      chunksByDepth: {},
    }
  }

  const tokenCounts = chunks.map((c) => estimateTokens(c.content))
  const totalTokens = tokenCounts.reduce((sum, t) => sum + t, 0)

  const chunksByType: Record<string, number> = {}
  const chunksByDepth: Record<number, number> = {}

  for (const chunk of chunks) {
    const type = chunk.metadata.nodeType
    chunksByType[type] = (chunksByType[type] || 0) + 1

    const depth = chunk.metadata.depth
    chunksByDepth[depth] = (chunksByDepth[depth] || 0) + 1
  }

  return {
    totalChunks: chunks.length,
    totalTokens,
    avgTokensPerChunk: Math.round(totalTokens / chunks.length),
    minTokens: Math.min(...tokenCounts),
    maxTokens: Math.max(...tokenCounts),
    chunksByType,
    chunksByDepth,
  }
}

// =============================================================================
// CHUNK VALIDATION
// =============================================================================

/**
 * Validate chunks before sending to embedding API
 * Ensures all chunks meet requirements
 */
export function validateChunks(
  chunks: MindMapChunkForEmbedding[],
  options: ChunkOptions = {}
): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const opts = { ...DEFAULT_CHUNK_OPTIONS, ...options }
  const errors: string[] = []
  const warnings: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const tokens = estimateTokens(chunk.content)

    // Check for empty content
    if (!chunk.content.trim()) {
      errors.push(`Chunk ${i}: Empty content`)
    }

    // Check for oversized chunks
    if (tokens > opts.maxTokensPerChunk * 1.5) {
      warnings.push(`Chunk ${i}: Significantly oversized (${tokens} tokens)`)
    }

    // Check for missing metadata
    if (!chunk.metadata.mindMapId) {
      errors.push(`Chunk ${i}: Missing mindMapId in metadata`)
    }

    // Check for invalid source
    if (chunk.metadata.source !== 'blocksuite_mindmap') {
      errors.push(`Chunk ${i}: Invalid source type`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
