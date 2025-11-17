/**
 * Work Items API Routes
 *
 * CRUD operations for work items with phase-based permission enforcement.
 *
 * Security layers:
 * 1. Authentication: User must be logged in
 * 2. Team membership: User must be team member
 * 3. Phase permissions: User must have edit access to target phase
 * 4. RLS: Database enforces final access control
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  validatePhasePermission,
  handlePermissionError,
  logPermissionDenial,
} from '@/lib/middleware/permission-middleware'
import { calculateWorkItemPhase } from '@/lib/constants/workspace-phases'
import type { WorkspacePhase } from '@/lib/types/team'

/**
 * GET /api/work-items
 *
 * List all work items in a workspace.
 * All team members can view all items (view-only access).
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get('workspace_id')
    const teamId = searchParams.get('team_id')

    if (!workspaceId || !teamId) {
      return NextResponse.json(
        { error: 'workspace_id and team_id are required' },
        { status: 400 }
      )
    }

    // Validate view permission (all team members have this)
    await validatePhasePermission({
      workspaceId,
      teamId,
      phase: 'planning', // Use planning as default phase for listing
      action: 'view',
    })

    // Fetch work items
    const { data: workItems, error } = await supabase
      .from('work_items')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching work items:', error)
      return NextResponse.json({ error: 'Failed to fetch work items' }, { status: 500 })
    }

    return NextResponse.json({ data: workItems })
  } catch (error) {
    return handlePermissionError(error)
  }
}

/**
 * POST /api/work-items
 *
 * Create a new work item.
 * Requires edit permission for the target phase.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const {
      workspace_id,
      team_id,
      title,
      description,
      status,
      has_timeline_breakdown,
      assigned_to,
      is_mind_map_conversion,
    } = body

    if (!workspace_id || !team_id || !title) {
      return NextResponse.json(
        { error: 'workspace_id, team_id, and title are required' },
        { status: 400 }
      )
    }

    // Calculate which phase this item will be in
    const phase = calculateWorkItemPhase({
      status: status ?? 'planning',
      has_timeline_breakdown: has_timeline_breakdown ?? false,
      assigned_to: assigned_to ?? null,
      is_mind_map_conversion: is_mind_map_conversion ?? false,
    })

    // Validate edit permission for target phase
    const user = await validatePhasePermission({
      workspaceId: workspace_id,
      teamId: team_id,
      phase,
      action: 'edit',
    })

    // Create work item
    const { data: workItem, error } = await supabase
      .from('work_items')
      .insert({
        id: Date.now().toString(),
        workspace_id,
        team_id,
        title,
        description: description ?? null,
        status: status ?? 'planning',
        has_timeline_breakdown: has_timeline_breakdown ?? false,
        assigned_to: assigned_to ?? null,
        is_mind_map_conversion: is_mind_map_conversion ?? false,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating work item:', error)
      return NextResponse.json({ error: 'Failed to create work item' }, { status: 500 })
    }

    return NextResponse.json({ data: workItem }, { status: 201 })
  } catch (error) {
    return handlePermissionError(error)
  }
}
