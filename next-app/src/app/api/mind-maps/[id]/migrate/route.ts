import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  migrateToBlockSuite,
  getBlockSuiteTree,
  summarizeMigration,
  DEFAULT_MIGRATION_OPTIONS,
} from '@/components/blocksuite/migration-utils'
import { safeValidateMigrateSingleRequest } from '@/components/blocksuite/schema'
import type { MindMapNode, MindMapEdge } from '@/lib/types/mind-map'

// ============================================================
// Security: Rate Limiting
// ============================================================

// Simple in-memory rate limiter per user (10 requests per minute for POST)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10

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
function sanitizeDbError(error: unknown): string {
  // Log full error for debugging
  console.error('Database error:', error)
  // Return generic message to client
  return 'Database operation failed'
}

/**
 * GET /api/mind-maps/[id]/migrate
 *
 * Get migration status for a single mind map
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mindMapId } = await params

    // Validate ID format
    if (!isValidId(mindMapId)) {
      return NextResponse.json({ error: 'Invalid mind map ID format' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team memberships for explicit team_id filtering
    const { data: userTeams, error: teamsError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)

    if (teamsError || !userTeams || userTeams.length === 0) {
      return NextResponse.json({ error: 'No team membership found' }, { status: 403 })
    }

    const userTeamIds = userTeams.map((t) => t.team_id)

    // Get mind map with migration status (explicit team_id filtering + RLS)
    const { data: mindMap, error } = await supabase
      .from('mind_maps')
      .select(`
        id,
        workspace_id,
        team_id,
        migration_status,
        migration_warnings,
        migration_lost_edges,
        migrated_at,
        blocksuite_size_bytes
      `)
      .eq('id', mindMapId)
      .in('team_id', userTeamIds)
      .single()

    if (error || !mindMap) {
      return NextResponse.json({ error: 'Mind map not found' }, { status: 404 })
    }

    // Get node/edge counts for reference with team_id filtering
    const [nodesResult, edgesResult] = await Promise.all([
      supabase
        .from('mind_map_nodes')
        .select('id', { count: 'exact', head: true })
        .eq('mind_map_id', mindMapId)
        .eq('team_id', mindMap.team_id),
      supabase
        .from('mind_map_edges')
        .select('id', { count: 'exact', head: true })
        .eq('mind_map_id', mindMapId)
        .eq('team_id', mindMap.team_id),
    ])

    return NextResponse.json({
      mindMapId: mindMap.id,
      workspaceId: mindMap.workspace_id,
      status: mindMap.migration_status || 'pending',
      warnings: mindMap.migration_warnings || [],
      lostEdgeCount: mindMap.migration_lost_edges || 0,
      migratedAt: mindMap.migrated_at,
      sizeBytes: mindMap.blocksuite_size_bytes,
      sourceStats: {
        nodeCount: nodesResult.count || 0,
        edgeCount: edgesResult.count || 0,
      },
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/mind-maps/[id]/migrate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/mind-maps/[id]/migrate
 *
 * Migrate a single mind map to BlockSuite format
 *
 * Body:
 * - dryRun?: boolean (default: true) - Preview migration without saving
 * - skipLargeMaps?: boolean - Skip if size exceeds threshold
 * - maxSizeBytes?: number - Custom size threshold
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mindMapId } = await params

    // Validate ID format
    if (!isValidId(mindMapId)) {
      return NextResponse.json({ error: 'Invalid mind map ID format' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))

    // Validate request body
    const validation = safeValidateMigrateSingleRequest(body)
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

    // Get user's team memberships for explicit team_id filtering
    const { data: userTeams, error: teamsError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)

    if (teamsError || !userTeams || userTeams.length === 0) {
      return NextResponse.json({ error: 'No team membership found' }, { status: 403 })
    }

    const userTeamIds = userTeams.map((t) => t.team_id)

    // Get mind map (explicit team_id filtering + RLS)
    const { data: mindMap, error: mapError } = await supabase
      .from('mind_maps')
      .select('id, workspace_id, team_id, migration_status')
      .eq('id', mindMapId)
      .in('team_id', userTeamIds)
      .single()

    if (mapError || !mindMap) {
      return NextResponse.json({ error: 'Mind map not found' }, { status: 404 })
    }

    // Check if already migrated (unless it's a dry run)
    if (!options.dryRun && mindMap.migration_status === 'success') {
      return NextResponse.json(
        { error: 'Mind map already migrated. Use dryRun to preview re-migration.' },
        { status: 400 }
      )
    }

    // Get nodes and edges with team_id filtering for multi-tenancy security
    const [nodesResult, edgesResult] = await Promise.all([
      supabase
        .from('mind_map_nodes')
        .select('*')
        .eq('mind_map_id', mindMapId)
        .eq('team_id', mindMap.team_id),
      supabase
        .from('mind_map_edges')
        .select('*')
        .eq('mind_map_id', mindMapId)
        .eq('team_id', mindMap.team_id),
    ])

    if (nodesResult.error) {
      sanitizeDbError(nodesResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch mind map data' },
        { status: 500 }
      )
    }

    if (edgesResult.error) {
      sanitizeDbError(edgesResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch mind map data' },
        { status: 500 }
      )
    }

    const nodes = nodesResult.data as MindMapNode[]
    const edges = edgesResult.data as MindMapEdge[]

    // Perform migration
    const migrationOpts = {
      ...DEFAULT_MIGRATION_OPTIONS,
      dryRun: options.dryRun,
      skipLargeMaps: options.skipLargeMaps,
      maxSizeBytes: options.maxSizeBytes,
    }

    const result = migrateToBlockSuite(
      mindMapId,
      mindMap.workspace_id,
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
        .eq('id', mindMapId)

      if (progressError) {
        sanitizeDbError(progressError)
        return NextResponse.json(
          { error: 'Failed to start migration' },
          { status: 500 }
        )
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
        .eq('id', mindMapId)

      if (updateError) {
        sanitizeDbError(updateError)
        // Rollback status to 'failed' so migration can be retried (not stuck at 'in_progress')
        await supabase
          .from('mind_maps')
          .update({ migration_status: 'failed' })
          .eq('id', mindMapId)
        return NextResponse.json(
          { error: 'Migration completed but failed to save results' },
          { status: 500 }
        )
      }
    } else if (!options.dryRun && result.status === 'failed') {
      // Persist failed status to database
      const { error: failedError } = await supabase
        .from('mind_maps')
        .update({
          migration_status: 'failed',
          migration_warnings: result.warnings.slice(0, migrationOpts.maxWarningsPerMap),
        })
        .eq('id', mindMapId)

      if (failedError) {
        sanitizeDbError(failedError)
        // Log but don't return error - the migration already failed, just couldn't persist status
        console.warn('Failed to persist failed migration status')
      }
    } else if (!options.dryRun && result.status === 'skipped') {
      // Persist skipped status to database
      const { error: skippedError } = await supabase
        .from('mind_maps')
        .update({
          migration_status: 'skipped',
          migration_warnings: result.warnings.slice(0, migrationOpts.maxWarningsPerMap),
        })
        .eq('id', mindMapId)

      if (skippedError) {
        sanitizeDbError(skippedError)
        // Log but don't return error - the migration was skipped, just couldn't persist status
        console.warn('Failed to persist skipped migration status')
      }
    }

    // Return result
    return NextResponse.json({
      success: result.status === 'success' || result.status === 'warning',
      dryRun: options.dryRun,
      result,
      summary: summarizeMigration(result),
    })
  } catch (error: unknown) {
    console.error('Error in POST /api/mind-maps/[id]/migrate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
