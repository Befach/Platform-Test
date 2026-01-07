/**
 * Mind Map Embedding Service
 *
 * Shared service for generating embeddings from BlockSuite mind maps.
 * Can be called directly from API routes or background jobs.
 *
 * Uses text-embedding-3-large @ 1536 dimensions for best accuracy
 * while maintaining compatibility with existing document_chunks schema.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { extractTextFromBlockSuiteTree, computeTreeHash } from '@/components/blocksuite/text-extractor'
import { chunkMindmapForEmbedding, getChunkStats } from '@/components/blocksuite/mindmap-chunker'
import type { BlockSuiteMindmapNode } from '@/components/blocksuite/mindmap-types'

// =============================================================================
// CONFIGURATION
// =============================================================================

const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-large',
  dimensions: 1536, // Match existing schema (Matryoshka dimensionality)
  maxBatchSize: 50, // Max chunks per API call
  maxRetries: 3, // Max retry attempts for API calls
  baseDelayMs: 1000, // Base delay for exponential backoff (1 second)
}

// =============================================================================
// TYPES
// =============================================================================

export interface EmbedMindMapOptions {
  force?: boolean // Force re-embedding even if unchanged
}

export interface EmbedMindMapResult {
  success: boolean
  chunks: number
  tokens?: number
  durationMs: number
  reason?: 'unchanged' | 'empty' | 'no_chunks'
  error?: string
  stats?: {
    nodeCount: number
    avgTokensPerChunk: number
  }
}

// =============================================================================
// MAIN EMBEDDING FUNCTION
// =============================================================================

/**
 * Generate embeddings for a mind map
 *
 * Can be called directly from API routes or background jobs using
 * an already-authenticated Supabase client.
 *
 * @param supabase - Authenticated Supabase client (must have team access)
 * @param mindMapId - ID of mind map to embed
 * @param options - Embedding options
 * @returns Result with success status and chunk count
 */
export async function embedMindMap(
  supabase: SupabaseClient,
  mindMapId: string,
  options: EmbedMindMapOptions = {}
): Promise<EmbedMindMapResult> {
  const startTime = Date.now()
  const { force = false } = options

  try {
    // Get mind map with JSONB tree (RLS validates team access)
    const { data: mindMap, error: mindMapError } = await supabase
      .from('mind_maps')
      .select('id, team_id, workspace_id, name, blocksuite_tree, embedding_version, last_embedded_hash')
      .eq('id', mindMapId)
      .single()

    if (mindMapError || !mindMap) {
      return {
        success: false,
        chunks: 0,
        durationMs: Date.now() - startTime,
        error: 'Mind map not found',
      }
    }

    // Compute tree hash for change detection
    const tree = mindMap.blocksuite_tree as BlockSuiteMindmapNode | null
    const { hash: currentHash, nodeCount } = computeTreeHash(tree)

    // Skip if unchanged (unless forced)
    if (!force && mindMap.last_embedded_hash === currentHash) {
      return {
        success: true,
        chunks: 0,
        durationMs: Date.now() - startTime,
        reason: 'unchanged',
      }
    }

    // Optimistic locking: atomically mark as processing only if not already processing
    // This prevents concurrent embedding of the same mind map
    const { data: lockResult, error: lockError } = await supabase
      .from('mind_maps')
      .update({ embedding_status: 'processing' })
      .eq('id', mindMapId)
      .neq('embedding_status', 'processing') // Only update if NOT already processing
      .select('id')

    // If no rows updated, another process is already embedding this mind map
    if (lockError || !lockResult || lockResult.length === 0) {
      console.log(`[Embed] Mind map ${mindMapId} is already being processed by another request`)
      return {
        success: true,
        chunks: 0,
        durationMs: Date.now() - startTime,
        reason: 'unchanged', // Treat as no-op
      }
    }

    // Extract text from JSONB tree
    const extraction = extractTextFromBlockSuiteTree(tree)

    if (extraction.totalNodes === 0) {
      await supabase
        .from('mind_maps')
        .update({
          embedding_status: 'skipped',
          chunk_count: 0,
          last_embedded_at: new Date().toISOString(),
          last_embedded_hash: currentHash,
        })
        .eq('id', mindMapId)

      return {
        success: true,
        chunks: 0,
        durationMs: Date.now() - startTime,
        reason: 'empty',
      }
    }

    // Chunk for embedding with full context (teamId required for RLS)
    const chunks = chunkMindmapForEmbedding(extraction, {
      mindMapId,
      teamId: mindMap.team_id,
      workspaceId: mindMap.workspace_id,
    })

    if (chunks.length === 0) {
      await supabase
        .from('mind_maps')
        .update({
          embedding_status: 'skipped',
          chunk_count: 0,
          last_embedded_at: new Date().toISOString(),
          last_embedded_hash: currentHash,
        })
        .eq('id', mindMapId)

      return {
        success: true,
        chunks: 0,
        durationMs: Date.now() - startTime,
        reason: 'no_chunks',
      }
    }

    // Get chunk statistics for logging
    const stats = getChunkStats(chunks)
    console.log(`[Embed] Mind map ${mindMapId}: ${stats.totalChunks} chunks, ~${stats.totalTokens} tokens`)

    // Generate embeddings with text-embedding-3-large @ 1536 dims
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    // Batch chunks for API calls
    const batches: typeof chunks[] = []
    for (let i = 0; i < chunks.length; i += EMBEDDING_CONFIG.maxBatchSize) {
      batches.push(chunks.slice(i, i + EMBEDDING_CONFIG.maxBatchSize))
    }

    // Generate embeddings for all batches
    const allEmbeddings: number[][] = []
    let totalTokens = 0

    for (const batch of batches) {
      // Use retry wrapper for resilience against transient errors
      const response = await fetchWithRetry('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: EMBEDDING_CONFIG.model,
          input: batch.map((c) => c.content),
          dimensions: EMBEDDING_CONFIG.dimensions,
        }),
      })

      const data = await response.json()

      for (const item of data.data) {
        allEmbeddings.push(item.embedding)
      }

      totalTokens += data.usage?.total_tokens || 0
    }

    // Delete old chunks for this mind map
    await supabase
      .from('document_chunks')
      .delete()
      .eq('mind_map_id', mindMapId)

    // Insert new chunks with embeddings
    const newChunks = chunks.map((chunk, i) => ({
      id: Date.now().toString() + '-' + i,
      mind_map_id: mindMapId,
      document_id: null, // Not a document chunk
      chunk_index: chunk.index,
      content: chunk.content,
      token_count: Math.ceil(chunk.content.length / 4),
      embedding: formatEmbeddingForPgvector(allEmbeddings[i]),
      heading: chunk.heading,
      metadata: {
        ...chunk.metadata,
        workspaceId: mindMap.workspace_id,
        teamId: mindMap.team_id,
      },
      source_type: 'blocksuite_mindmap',
    }))

    const { error: insertError } = await supabase
      .from('document_chunks')
      .insert(newChunks)

    if (insertError) {
      console.error('[Embed] Insert error:', insertError)
      throw new Error(`Failed to store chunks: ${insertError.message}`)
    }

    // Update mind map status
    await supabase
      .from('mind_maps')
      .update({
        embedding_status: 'ready',
        embedding_error: null,
        chunk_count: chunks.length,
        last_embedded_at: new Date().toISOString(),
        embedding_version: (mindMap.embedding_version || 0) + 1,
        last_embedded_hash: currentHash,
      })
      .eq('id', mindMapId)

    return {
      success: true,
      chunks: chunks.length,
      tokens: totalTokens,
      durationMs: Date.now() - startTime,
      stats: {
        nodeCount,
        avgTokensPerChunk: stats.avgTokensPerChunk,
      },
    }
  } catch (error) {
    console.error('[Embed] Error:', error)

    // Update status to error
    await supabase
      .from('mind_maps')
      .update({
        embedding_status: 'error',
        embedding_error: error instanceof Error ? error.message : String(error),
      })
      .eq('id', mindMapId)

    return {
      success: false,
      chunks: 0,
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Embedding failed',
    }
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format embedding array for pgvector insertion
 */
function formatEmbeddingForPgvector(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}

/**
 * Fetch with exponential backoff retry
 * Retries on transient errors (rate limits, server errors)
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = EMBEDDING_CONFIG.maxRetries,
  baseDelayMs: number = EMBEDDING_CONFIG.baseDelayMs
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // Don't retry on client errors (except rate limits)
      if (response.ok) {
        return response
      }

      // Retry on rate limits (429) and server errors (5xx)
      if (response.status === 429 || response.status >= 500) {
        const errorData = await response.json().catch(() => ({}))
        lastError = new Error(
          `API error ${response.status}: ${errorData.error?.message || response.statusText}`
        )

        // If we have retries left, wait and try again
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = baseDelayMs * Math.pow(2, attempt)
          console.log(
            `[Embed] Retry ${attempt + 1}/${maxRetries} after ${delay}ms (status: ${response.status})`
          )
          await sleep(delay)
          continue
        }
      }

      // Non-retryable error
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Embedding API error: ${errorData.error?.message || response.statusText}`
      )
    } catch (error) {
      // Network errors are retryable
      if (error instanceof TypeError && error.message.includes('fetch')) {
        lastError = error
        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt)
          console.log(`[Embed] Retry ${attempt + 1}/${maxRetries} after ${delay}ms (network error)`)
          await sleep(delay)
          continue
        }
      }

      // Re-throw non-retryable errors
      throw error
    }
  }

  // All retries exhausted
  throw lastError || new Error('Max retries exceeded')
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
