/**
 * Knowledge Compression API
 *
 * POST /api/knowledge/compression - Trigger compression job
 * GET  /api/knowledge/compression - List compression jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runCompressionJob, listJobs } from '@/lib/ai/compression'
import { embedMindMap } from '@/lib/ai/embeddings/mindmap-embedding-service'
import type { CompressionJobType, CompressionJobStatus } from '@/lib/types/collective-intelligence'
import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// CONFIGURATION
// =============================================================================

const MINDMAP_EMBED_CONFIG = {
  defaultBatchLimit: 3, // Default number of mind maps to process per job (conservative for serverless)
  maxBatchLimit: 10, // Maximum allowed batch limit (keep low to avoid timeout)
  timeoutMs: 50000, // Stop processing if approaching serverless timeout (50s of 60s limit)
}

/**
 * POST /api/knowledge/compression
 *
 * Trigger a compression job
 *
 * Request body:
 * - jobType: 'l2_summary' | 'l3_clustering' | 'l4_extraction' | 'full_refresh'
 * - workspaceId: Optional workspace scope
 * - documentIds: Optional specific documents to process
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const teamId = membership.team_id

    // Parse request body
    const body = await request.json()
    const {
      jobType,
      workspaceId,
      documentIds,
      batchLimit,
    } = body as {
      jobType: CompressionJobType
      workspaceId?: string
      documentIds?: string[]
      batchLimit?: number // Optional: number of mind maps to process per job
    }

    // Validate job type
    const validJobTypes: CompressionJobType[] = ['l2_summary', 'l3_clustering', 'l4_extraction', 'full_refresh', 'mindmap_embed']
    if (!jobType || !validJobTypes.includes(jobType)) {
      return NextResponse.json(
        { error: `Invalid job type. Must be one of: ${validJobTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Handle mindmap_embed job type separately
    if (jobType === 'mindmap_embed') {
      // Validate and clamp batch limit
      const effectiveBatchLimit = Math.min(
        Math.max(1, batchLimit || MINDMAP_EMBED_CONFIG.defaultBatchLimit),
        MINDMAP_EMBED_CONFIG.maxBatchLimit
      )
      const result = await runMindmapEmbedJob(supabase, teamId, workspaceId, user.id, effectiveBatchLimit)
      return NextResponse.json({
        job: result,
        message: `Mind map embedding job completed: ${result.processed} processed, ${result.failed} failed`,
      }, { status: 200 })
    }

    // Run the compression job (async - returns immediately with job status)
    const job = await runCompressionJob({
      teamId,
      workspaceId,
      jobType,
      documentIds,
      triggeredBy: user.id,
    })

    return NextResponse.json({
      job,
      message: `Compression job started: ${jobType}`,
    }, { status: 202 })
  } catch (error) {
    console.error('[Compression API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start compression job' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/knowledge/compression
 *
 * List compression jobs
 *
 * Query params:
 * - workspaceId: Filter by workspace
 * - status: Filter by status
 * - limit: Max results (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const teamId = membership.team_id

    // Parse query params
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || undefined
    const status = searchParams.get('status') as CompressionJobStatus | undefined
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get jobs
    const jobs = await listJobs(teamId, {
      workspaceId,
      status,
      limit: Math.min(limit, 100),
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('[Compression API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to list compression jobs' },
      { status: 500 }
    )
  }
}

// =============================================================================
// MINDMAP EMBEDDING JOB
// =============================================================================

interface MindmapEmbedJobResult {
  type: 'mindmap_embed'
  teamId: string
  workspaceId?: string
  processed: number
  failed: number
  skipped: number
  remaining: number // Number of mind maps not processed due to timeout
  status: 'completed' | 'failed' | 'partial' // partial = stopped early due to timeout
  startedAt: string
  completedAt: string
  errors: string[]
}

/**
 * Run mind map embedding job for pending mind maps
 *
 * @param supabase - Authenticated Supabase client
 * @param teamId - Team ID for filtering
 * @param workspaceId - Optional workspace filter
 * @param _triggeredBy - User ID who triggered the job
 * @param batchLimit - Number of mind maps to process per job (default: 10)
 */
async function runMindmapEmbedJob(
  supabase: SupabaseClient,
  teamId: string,
  workspaceId: string | undefined,
  _triggeredBy: string,
  batchLimit: number = MINDMAP_EMBED_CONFIG.defaultBatchLimit
): Promise<MindmapEmbedJobResult> {
  const startedAt = new Date().toISOString()
  const startTime = Date.now()
  const errors: string[] = []
  let processed = 0
  let failed = 0
  let skipped = 0
  let remaining = 0

  try {
    // Find mind maps that need embedding (exclude 'processing' to avoid conflicts)
    let query = supabase
      .from('mind_maps')
      .select('id, name')
      .eq('team_id', teamId)
      .in('embedding_status', ['pending', 'error'])
      .not('blocksuite_tree', 'is', null)
      .limit(batchLimit)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data: mindMaps, error: queryError } = await query

    if (queryError) {
      throw new Error(`Failed to query mind maps: ${queryError.message}`)
    }

    if (!mindMaps || mindMaps.length === 0) {
      return {
        type: 'mindmap_embed',
        teamId,
        workspaceId,
        processed: 0,
        failed: 0,
        skipped: 0,
        remaining: 0,
        status: 'completed',
        startedAt,
        completedAt: new Date().toISOString(),
        errors: [],
      }
    }

    // Process each mind map using the embedding service directly
    // This avoids HTTP requests and uses the authenticated Supabase client
    for (let i = 0; i < mindMaps.length; i++) {
      const mindMap = mindMaps[i]

      // Timeout detection: stop early if approaching serverless timeout
      const elapsed = Date.now() - startTime
      if (elapsed >= MINDMAP_EMBED_CONFIG.timeoutMs) {
        remaining = mindMaps.length - i
        console.log(`[MindmapEmbed] Stopping early: ${elapsed}ms elapsed, ${remaining} mind maps remaining`)
        break
      }

      try {
        // Call embedding service directly with authenticated client
        const result = await embedMindMap(supabase, mindMap.id, { force: false })

        if (!result.success) {
          throw new Error(result.error || 'Embedding failed')
        }

        if (result.reason === 'unchanged' || result.reason === 'empty' || result.reason === 'no_chunks') {
          skipped++
        } else {
          processed++
        }

        console.log(`[MindmapEmbed] Processed ${mindMap.name}: ${result.chunks || 0} chunks (${Date.now() - startTime}ms elapsed)`)
      } catch (error) {
        failed++
        const message = `Failed to embed ${mindMap.name}: ${error instanceof Error ? error.message : String(error)}`
        errors.push(message)
        console.error(`[MindmapEmbed] ${message}`)
      }
    }

    // Determine final status
    let status: 'completed' | 'failed' | 'partial'
    if (remaining > 0) {
      status = 'partial' // Stopped early due to timeout
    } else if (failed > 0 && processed === 0) {
      status = 'failed'
    } else {
      status = 'completed'
    }

    return {
      type: 'mindmap_embed',
      teamId,
      workspaceId,
      processed,
      failed,
      skipped,
      remaining,
      status,
      startedAt,
      completedAt: new Date().toISOString(),
      errors,
    }
  } catch (error) {
    return {
      type: 'mindmap_embed',
      teamId,
      workspaceId,
      processed,
      failed,
      skipped,
      remaining,
      status: 'failed',
      startedAt,
      completedAt: new Date().toISOString(),
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}
