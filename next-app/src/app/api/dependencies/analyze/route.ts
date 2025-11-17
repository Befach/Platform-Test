import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateCriticalPath } from '@/lib/algorithms/critical-path'
import { detectCycles } from '@/lib/algorithms/cycle-detection'

// POST /api/dependencies/analyze - Analyze dependencies for critical path and cycles
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workspace_id } = body

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace to verify access
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('team_id')
      .eq('id', workspace_id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user has access to this workspace's team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all work items for this workspace
    const { data: workItems, error: workItemsError } = await supabase
      .from('work_items')
      .select('*')
      .eq('team_id', workspace.team_id)
      .eq('workspace_id', workspace_id)

    if (workItemsError) {
      console.error('Error fetching work items:', workItemsError)
      return NextResponse.json({ error: workItemsError.message }, { status: 500 })
    }

    // Get all active connections for this workspace
    const { data: connections, error: connectionsError } = await supabase
      .from('feature_connections')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('status', 'active')

    if (connectionsError) {
      console.error('Error fetching connections:', connectionsError)
      return NextResponse.json({ error: connectionsError.message }, { status: 500 })
    }

    if (!workItems || workItems.length === 0) {
      return NextResponse.json({
        hasCycles: false,
        cycles: [],
        criticalPath: [],
        projectDuration: 0,
        healthScore: 100,
        message: 'No work items found in this workspace',
      })
    }

    // Run cycle detection first
    const cycleResult = detectCycles(workItems, connections || [])

    // If there are cycles, return cycle info and skip critical path
    if (cycleResult.hasCycles) {
      return NextResponse.json({
        hasCycles: true,
        cycles: cycleResult.cycles,
        totalCycles: cycleResult.totalCycles,
        affectedWorkItems: cycleResult.affectedWorkItems,
        healthScore: cycleResult.healthScore,
        criticalPath: [],
        projectDuration: 0,
        bottlenecks: [],
        warnings: [
          'Circular dependencies detected. Resolve cycles before calculating critical path.',
        ],
      })
    }

    // Calculate critical path (only if no cycles)
    const criticalPathResult = calculateCriticalPath(workItems, connections || [])

    // Combine results
    return NextResponse.json({
      hasCycles: false,
      cycles: [],
      totalCycles: 0,
      affectedWorkItems: [],
      criticalPath: criticalPathResult.criticalPath,
      projectDuration: criticalPathResult.projectDuration,
      nodes: criticalPathResult.nodes,
      bottlenecks: criticalPathResult.bottlenecks,
      healthScore: criticalPathResult.healthScore,
      warnings: criticalPathResult.warnings,
    })
  } catch (error: any) {
    console.error('Error in POST /api/dependencies/analyze:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
