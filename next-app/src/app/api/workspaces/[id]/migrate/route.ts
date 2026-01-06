import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  migrateToBlockSuite,
  getBlockSuiteTree,
  createBatchResult,
  DEFAULT_MIGRATION_OPTIONS,
} from '@/components/blocksuite/migration-utils'
import { safeValidateMigrateWorkspaceRequest } from '@/components/blocksuite/schema'
import type { MindMapNode, MindMapEdge } from '@/lib/types/mind-map'
import type { MigrationResult, MigrationStatus } from '@/components/blocksuite/mindmap-types'

// ============================================================
// Security: Rate Limiting
// ============================================================

// Simple in-memory rate limiter per user (5 requests per minute for batch POST)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5 // Lower limit for batch operations

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  userLimit.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - userLimit.count }
}

// ============================================================
// Security: ID Validation
// ============================================================

// Validate timestamp-based ID format (numeric string, 13-15 digits for Date.now())
function isValidId(id: string): boolean {
  return /^\d{10,16}$/.test(id)
}

// ============================================================
// Security: Error Sanitization
// ============================================================

// Sanitize error messages to prevent information disclosure
function sanitizeDbError(error: unknown): void {
  // Log full error for debugging
  console.error('Database error:', error)
}

/**
 * GET /api/workspaces/[id]/migrate
 *
 * Get migration status for all mind maps in a workspace
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params

    // Validate ID format
    if (!isValidId(workspaceId)) {
      return NextResponse.json({ error: 'Invalid workspace ID format' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace (RLS handles team access)
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, team_id, name')
      .eq('id', workspaceId)
      .single()

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get migration status counts for all mind maps in workspace (explicit team_id filtering + RLS)
    const { data: mindMaps, error: mapsError } = await supabase
      .from('mind_maps')
      .select(`
        id,
        migration_status,
        migration_lost_edges,
        blocksuite_size_bytes,
        migrated_at
      `)
      .eq('workspace_id', workspaceId)
      .eq('team_id', workspace.team_id)

    if (mapsError) {
      sanitizeDbError(mapsError)
      return NextResponse.json(
        { error: 'Failed to fetch migration status' },
        { status: 500 }
      )
    }

    // Calculate stats
    const statusCounts: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      success: 0,
      warning: 0,
      failed: 0,
      skipped: 0,
    }

    let totalLostEdges = 0
    let totalSizeBytes = 0
    let largeMapCount = 0

    for (const map of mindMaps || []) {
      const status = (map.migration_status as MigrationStatus) || 'pending'
      statusCounts[status] = (statusCounts[status] || 0) + 1
      totalLostEdges += map.migration_lost_edges || 0
      totalSizeBytes += map.blocksuite_size_bytes || 0
      if ((map.blocksuite_size_bytes || 0) > 2048) {
        largeMapCount++
      }
    }

    const total = mindMaps?.length || 0
    const migrated = statusCounts.success + statusCounts.warning

    return NextResponse.json({
      workspaceId,
      workspaceName: workspace.name,
      total,
      migrated,
      pending: statusCounts.pending,
      inProgress: statusCounts.in_progress,
      failed: statusCounts.failed,
      skipped: statusCounts.skipped,
      withWarnings: statusCounts.warning,
      lostEdgesTotal: totalLostEdges,
      totalSizeBytes,
      largeMapCount,
      breakdown: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      })),
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/workspaces/[id]/migrate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/workspaces/[id]/migrate
 *
 * Batch migrate all pending mind maps in a workspace
 *
 * Body:
 * - dryRun?: boolean (default: true) - Preview migration without saving
 * - batchSize?: number (default: 10) - Maps to process in one request
 * - skipLargeMaps?: boolean (default: true for batch) - Skip large maps
 * - maxSizeBytes?: number - Custom size threshold
 * - limit?: number - Max maps to process (optional cap)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params

    // Validate ID format
    if (!isValidId(workspaceId)) {
      return NextResponse.json({ error: 'Invalid workspace ID format' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))

    // Validate request body
    const validation = safeValidateMigrateWorkspaceRequest(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }
    const options = validation.data

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit check (only for POST operations that modify data)
    if (!options.dryRun) {
      const rateLimit = checkRateLimit(user.id)
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
    }

    // Get workspace (RLS handles team access)
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, team_id')
      .eq('id', workspaceId)
      .single()

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get mind maps to migrate - explicit team_id filtering + RLS
    // If force=true, include all maps including already migrated ones
    // Otherwise, only get pending/failed/null status maps
    // Note: .in() doesn't match NULL, so we use .or() to handle null values
    // Fetch one extra to detect if there are more records for pagination
    const fetchLimit = options.limit || options.batchSize
    const statusOrFilter = options.force
      ? 'migration_status.in.(pending,failed,success,warning,skipped),migration_status.is.null'
      : 'migration_status.in.(pending,failed),migration_status.is.null'
    const { data: pendingMaps, error: mapsError } = await supabase
      .from('mind_maps')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('team_id', workspace.team_id)
      .or(statusOrFilter)
      .limit(fetchLimit + 1)

    if (mapsError) {
      sanitizeDbError(mapsError)
      return NextResponse.json(
        { error: 'Failed to fetch pending mind maps' },
        { status: 500 }
      )
    }

    if (!pendingMaps || pendingMaps.length === 0) {
      return NextResponse.json({
        success: true,
        dryRun: options.dryRun,
        message: 'No pending mind maps to migrate',
        result: createBatchResult([], new Date().toISOString()),
      })
    }

    const startedAt = new Date().toISOString()
    const results: MigrationResult[] = []

    // Process each map (respects limit if specified, otherwise uses batchSize)
    for (const map of pendingMaps.slice(0, fetchLimit)) {
      // Get nodes and edges for this map with team_id filtering for multi-tenancy security
      const [nodesResult, edgesResult] = await Promise.all([
        supabase
          .from('mind_map_nodes')
          .select('*')
          .eq('mind_map_id', map.id)
          .eq('team_id', workspace.team_id),
        supabase
          .from('mind_map_edges')
          .select('*')
          .eq('mind_map_id', map.id)
          .eq('team_id', workspace.team_id),
      ])

      if (nodesResult.error || edgesResult.error) {
        if (nodesResult.error) sanitizeDbError(nodesResult.error)
        if (edgesResult.error) sanitizeDbError(edgesResult.error)
        results.push({
          mindMapId: map.id,
          workspaceId,
          status: 'failed',
          nodeCount: 0,
          edgeCount: 0,
          treeNodeCount: 0,
          lostEdgeCount: 0,
          warnings: [],
          error: 'Failed to fetch mind map data',
          durationMs: 0,
        })
        continue
      }

      const nodes = nodesResult.data as MindMapNode[]
      const edges = edgesResult.data as MindMapEdge[]

      // Perform migration
      const migrationOpts = {
        ...DEFAULT_MIGRATION_OPTIONS,
        dryRun: options.dryRun,
        batchSize: options.batchSize,
        skipLargeMaps: options.skipLargeMaps ?? true, // Default true for batch
        maxSizeBytes: options.maxSizeBytes,
      }

      const result = migrateToBlockSuite(
        map.id,
        workspaceId,
        nodes,
        edges,
        migrationOpts
      )

      // If not a dry run and migration succeeded, save to database
      if (!options.dryRun && (result.status === 'success' || result.status === 'warning')) {
        // Mark as in_progress first
        const { error: progressError } = await supabase
          .from('mind_maps')
          .update({ migration_status: 'in_progress' })
          .eq('id', map.id)
          .eq('team_id', workspace.team_id)

        if (progressError) {
          sanitizeDbError(progressError)
          result.status = 'failed'
          result.error = 'Failed to start migration'
          results.push(result)
          continue
        }

        // Get the tree for storage
        const tree = getBlockSuiteTree(nodes, edges)

        // Save migration result
        const { error: updateError } = await supabase
          .from('mind_maps')
          .update({
            blocksuite_tree: tree,
            blocksuite_size_bytes: result.sizeBytes,
            migration_status: result.status,
            migration_warnings: result.warnings.slice(0, migrationOpts.maxWarningsPerMap),
            migration_lost_edges: result.lostEdgeCount,
            migrated_at: new Date().toISOString(),
          })
          .eq('id', map.id)
          .eq('team_id', workspace.team_id)

        if (updateError) {
          sanitizeDbError(updateError)
          // Rollback status to 'failed' so migration can be retried (not stuck at 'in_progress')
          await supabase
            .from('mind_maps')
            .update({ migration_status: 'failed' })
            .eq('id', map.id)
            .eq('team_id', workspace.team_id)
          result.status = 'failed'
          result.error = 'Failed to save migration results'
        }
      } else if (!options.dryRun && result.status === 'failed') {
        // Mark as failed in database
        const { error: failedError } = await supabase
          .from('mind_maps')
          .update({
            migration_status: 'failed',
            migration_warnings: result.warnings.slice(0, migrationOpts.maxWarningsPerMap),
          })
          .eq('id', map.id)
          .eq('team_id', workspace.team_id)

        if (failedError) {
          sanitizeDbError(failedError)
          // Log but continue - the migration already failed, just couldn't persist status
          console.warn(`Failed to persist failed status for map ${map.id}`)
        }
      } else if (!options.dryRun && result.status === 'skipped') {
        // Mark as skipped in database
        const { error: skippedError } = await supabase
          .from('mind_maps')
          .update({
            migration_status: 'skipped',
            migration_warnings: result.warnings.slice(0, migrationOpts.maxWarningsPerMap),
          })
          .eq('id', map.id)
          .eq('team_id', workspace.team_id)

        if (skippedError) {
          sanitizeDbError(skippedError)
          // Log but continue - the migration was skipped, just couldn't persist status
          console.warn(`Failed to persist skipped status for map ${map.id}`)
        }
      }

      results.push(result)
    }

    // Create batch result
    const batchResult = createBatchResult(results, startedAt)

    // hasMore is true if we fetched more records than fetchLimit (we fetched fetchLimit + 1)
    const hasMore = pendingMaps.length > fetchLimit

    return NextResponse.json({
      success: batchResult.failed === 0,
      dryRun: options.dryRun,
      result: batchResult,
      hasMore,
      // remainingCount is approximate - at least this many remain if hasMore is true
      remainingCount: hasMore ? pendingMaps.length - fetchLimit : 0,
    })
  } catch (error: unknown) {
    console.error('Error in POST /api/workspaces/[id]/migrate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
