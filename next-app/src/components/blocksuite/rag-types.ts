/**
 * Phase 5: RAG Layer Integration Types
 *
 * TypeScript types for BlockSuite mind map embedding and semantic search.
 * These types bridge the BlockSuite mind map system to the Knowledge Base RAG pipeline.
 *
 * Architecture:
 * - MindMapEmbeddingStatus: Tracks embedding generation state
 * - ExtractedTextNode: Text extraction result with path context
 * - ChunkForEmbedding: Prepared chunks for embedding API
 * - MindMapChunkMetadata: Chunk metadata for search results
 */

import type { BlockSuiteMindmapNode } from './mindmap-types'

// =============================================================================
// EMBEDDING STATUS TYPES
// =============================================================================

/**
 * Embedding generation status for mind maps
 * Maps to mind_maps.embedding_status column
 */
export type MindMapEmbeddingStatusType =
  | 'pending'     // Waiting to be embedded (new or updated)
  | 'processing'  // Currently generating embeddings
  | 'ready'       // Embeddings generated successfully
  | 'error'       // Embedding generation failed
  | 'skipped'     // Skipped (empty tree or too small)

/**
 * Full embedding status object for mind maps
 * Combines all embedding-related columns from mind_maps table
 */
export interface MindMapEmbeddingStatus {
  /** Current embedding status */
  status: MindMapEmbeddingStatusType
  /** Error message if status is 'error' */
  error?: string
  /** Timestamp of last successful embedding */
  lastEmbeddedAt?: string
  /** Embedding version for cache invalidation */
  embeddingVersion: number
  /** Number of chunks generated */
  chunkCount: number
  /** Hash of tree for change detection */
  lastEmbeddedHash?: string
}

// =============================================================================
// TEXT EXTRACTION TYPES
// =============================================================================

/**
 * Single node from text extraction with path context
 * Preserves tree structure and ancestor information for chunking
 */
export interface ExtractedTextNode {
  /** Unique identifier for this extracted node */
  id: string
  /** The text content of the node */
  text: string
  /** Ancestor path as array: ["Root", "Goals", "Revenue"] */
  path: string[]
  /** Full path as string: "Root > Goals > Revenue" */
  fullPath: string
  /** Depth in tree (0 = root) */
  depth: number
  /** Node type based on position */
  nodeType: 'root' | 'branch' | 'leaf'
  /** Child nodes (preserves tree structure) */
  children: ExtractedTextNode[]
  /** Original BlockSuite metadata preserved */
  metadata: {
    xywh?: string
    layoutType?: 'left' | 'right'
  }
}

/**
 * Result of extracting text from a BlockSuite tree
 */
export interface ExtractionResult {
  /** Extracted nodes with full tree structure */
  nodes: ExtractedTextNode[]
  /** All text concatenated (for simple operations) */
  flatText: string
  /** Total nodes extracted */
  totalNodes: number
  /** Maximum depth found in tree */
  maxDepth: number
  /** Timestamp of extraction */
  extractedAt: string
}

/**
 * Options for text extraction
 */
export interface ExtractionOptions {
  /** Maximum depth to extract (default: unlimited) */
  maxDepth?: number
  /** Include nodes with empty text (default: false) */
  includeEmpty?: boolean
}

// =============================================================================
// CHUNKING TYPES
// =============================================================================

/**
 * Chunk prepared for embedding API
 * Contains content with path context for better retrieval
 */
export interface MindMapChunkForEmbedding {
  /** Chunk content with path context prefix */
  content: string
  /** Index within the mind map */
  index: number
  /** Node heading/title for display */
  heading: string
  /** Metadata for storage and retrieval */
  metadata: MindMapChunkMetadata
}

/**
 * Metadata stored with each mind map chunk
 * Used for filtering, display, and tracing back to source
 */
export interface MindMapChunkMetadata {
  /** Source mind map ID */
  mindMapId: string
  /** Workspace containing the mind map */
  workspaceId?: string
  /** Team owning the mind map */
  teamId?: string
  /** Ancestor path for context */
  path: string[]
  /** Node type (root/branch/leaf) */
  nodeType: 'root' | 'branch' | 'leaf'
  /** Depth in original tree */
  depth: number
  /** Source type identifier */
  source: 'blocksuite_mindmap'
}

/**
 * Options for chunking mind map content
 */
export interface ChunkOptions {
  /** Maximum tokens per chunk (default: 300) */
  maxTokensPerChunk?: number
  /** Minimum chunk size to avoid tiny fragments (default: 50) */
  minChunkSize?: number
  /** Include path context prefix (default: true) */
  includePathContext?: boolean
  /** Maximum ancestors in path prefix (default: 3) */
  maxPathDepth?: number
}

// =============================================================================
// API TYPES
// =============================================================================

/**
 * Request body for POST /api/mind-maps/[id]/embed
 */
export interface EmbedMindMapRequest {
  /** Force re-embedding even if hash matches (default: false) */
  force?: boolean
}

/**
 * Response from POST /api/mind-maps/[id]/embed
 */
export interface EmbedMindMapResponse {
  /** Whether embedding succeeded */
  success: boolean
  /** Number of chunks generated */
  chunks: number
  /** Total tokens used (for cost tracking) */
  tokens?: number
  /** Duration in milliseconds */
  durationMs: number
  /** Reason if skipped */
  reason?: 'empty' | 'no_chunks' | 'unchanged' | 'error'
  /** Error message if failed */
  error?: string
}

/**
 * Mind map with embedding status (for listing)
 */
export interface MindMapWithEmbeddingStatus {
  id: string
  name: string
  workspaceId?: string
  teamId: string
  /** Embedding status information */
  embedding: MindMapEmbeddingStatus
  /** Last tree update timestamp */
  updatedAt: string
}

// =============================================================================
// SEARCH TYPES
// =============================================================================

/**
 * Search result from mind map chunks
 * Extends base search result with mind map specific fields
 */
export interface MindMapSearchResult {
  /** Chunk ID */
  chunkId: string
  /** Source mind map ID */
  mindMapId: string
  /** Mind map name */
  mindMapName: string
  /** Chunk content */
  content: string
  /** Similarity score (0-1) */
  similarity: number
  /** Node heading */
  heading?: string
  /** Path context for display */
  path?: string[]
  /** Source type identifier */
  sourceType: 'blocksuite_mindmap'
}

// =============================================================================
// JOB TYPES
// =============================================================================

/**
 * Compression job type for mind map embedding
 */
export type MindMapEmbedJobType = 'mindmap_embed'

/**
 * Mind map embedding job status
 */
export interface MindMapEmbedJobStatus {
  /** Job type identifier */
  type: 'mindmap_embed'
  /** Team ID scope */
  teamId: string
  /** Optional workspace scope */
  workspaceId?: string
  /** Number of maps processed */
  processed: number
  /** Number of maps failed */
  failed: number
  /** Number of maps skipped */
  skipped: number
  /** Job status */
  status: 'running' | 'completed' | 'failed'
  /** Job start time */
  startedAt: string
  /** Job completion time */
  completedAt?: string
  /** Error if failed */
  error?: string
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Tree traversal callback for walking BlockSuite trees
 */
export type TreeWalkCallback = (
  node: BlockSuiteMindmapNode,
  path: string[],
  depth: number
) => void | boolean // Return false to stop traversal

/**
 * Result of computing tree hash for change detection
 */
export interface TreeHashResult {
  /** MD5 hash of tree content */
  hash: string
  /** Number of nodes in tree */
  nodeCount: number
  /** Total characters in tree text */
  charCount: number
}
