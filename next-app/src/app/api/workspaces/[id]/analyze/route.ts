/**
 * Workspace Analysis API Route
 *
 * Analyzes workspace health and returns metrics including:
 * - Phase distribution
 * - Health score (0-100)
 * - Upgrade opportunities
 * - Stale items
 * - Recommendations
 *
 * Security:
 * - All team members can view analysis (read-only)
 *
 * Endpoint:
 * - GET /api/workspaces/[id]/analyze - Get workspace analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeWorkspace } from '@/lib/workspace/analyzer-service'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/workspaces/[id]/analyze
 *
 * Analyze workspace health and return comprehensive metrics.
 *
 * Query parameters (optional):
 * - staleThreshold: Days without update to consider stale (default: 7)
 * - upgradeThreshold: Minimum readiness % for upgrade opportunity (default: 80)
 *
 * Response:
 * - workspaceId: string
 * - analyzedAt: ISO timestamp
 * - totalItems: number
 * - phaseDistribution: Record<phase, {count, percentage}>
 * - mismatchedItems: Array of items in wrong phase
 * - upgradeOpportunities: Array of items ready to advance
 * - staleItems: Array of items not updated recently
 * - healthScore: 0-100
 * - healthBreakdown: {distribution, readiness, freshness, flow}
 * - recommendations: string[]
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: workspaceId } = await params

    // Parse optional query parameters
    const url = new URL(req.url)
    const staleThresholdDays = parseInt(url.searchParams.get('staleThreshold') || '7', 10)
    const upgradeReadinessThreshold = parseInt(
      url.searchParams.get('upgradeThreshold') || '80',
      10
    )

    // Validate authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      )
    }

    // Get workspace to find team_id
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, team_id, name')
      .eq('id', workspaceId)
      .single()

    if (wsError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Validate team membership (any member can view analysis)
    const { data: membership } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('team_id', workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a team member', code: 'PERMISSION_DENIED' },
        { status: 403 }
      )
    }

    // Run analysis
    const analysis = await analyzeWorkspace(
      workspaceId,
      workspace.team_id,
      supabase,
      {
        staleThresholdDays,
        upgradeReadinessThreshold,
      }
    )

    return NextResponse.json({
      data: analysis,
      meta: {
        workspaceName: workspace.name,
        config: {
          staleThresholdDays,
          upgradeReadinessThreshold,
        },
      },
    })
  } catch (error) {
    console.error('Error in GET /api/workspaces/[id]/analyze:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        return NextResponse.json(
          { error: 'Failed to fetch workspace data', code: 'DATABASE_ERROR' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
