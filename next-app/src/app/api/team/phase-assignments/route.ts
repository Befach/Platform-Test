import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for creating phase assignments
const createPhaseAssignmentSchema = z.object({
  workspace_id: z.string(),
  user_id: z.string(),
  phase: z.enum(['research', 'planning', 'execution', 'review', 'complete']),
  can_edit: z.boolean(),
  notes: z.string().optional()
})

/**
 * GET /api/team/phase-assignments?workspace_id=xxx&user_id=xxx
 * List phase assignments for user in workspace or all assignments for workspace
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const workspace_id = searchParams.get('workspace_id')
    const user_id = searchParams.get('user_id')

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required', success: false },
        { status: 400 }
      )
    }

    // Get workspace and verify team membership
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, team_id')
      .eq('id', workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found', success: false },
        { status: 404 }
      )
    }

    // Check if user is a member of the team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this team', success: false },
        { status: 403 }
      )
    }

    // Build query for phase assignments
    let query = supabase
      .from('user_phase_assignments')
      .select(`
        id,
        user_id,
        workspace_id,
        phase,
        can_edit,
        notes,
        created_at,
        users:users!user_phase_assignments_user_id_fkey(
          id,
          email,
          name,
          avatar_url
        )
      `)
      .eq('workspace_id', workspace_id)

    // Filter by user_id if provided
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data: assignments, error: assignmentsError } = await query.order('created_at', { ascending: true })

    if (assignmentsError) {
      console.error('Error fetching phase assignments:', assignmentsError)
      return NextResponse.json(
        { error: 'Failed to fetch phase assignments', details: assignmentsError.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: assignments,
      success: true
    })

  } catch (error) {
    console.error('Error in GET /api/team/phase-assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}

/**
 * POST /api/team/phase-assignments
 * Create new phase assignment
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = createPhaseAssignmentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors, success: false },
        { status: 400 }
      )
    }

    const { workspace_id, user_id, phase, can_edit, notes } = validation.data

    // Get workspace and verify team membership
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, team_id')
      .eq('id', workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found', success: false },
        { status: 404 }
      )
    }

    // Check if requesting user is owner or admin
    const { data: requesterMembership, error: requesterError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (requesterError || !requesterMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this team', success: false },
        { status: 403 }
      )
    }

    if (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can create phase assignments', success: false },
        { status: 403 }
      )
    }

    // Verify target user is a member of the team
    const { data: targetMembership, error: targetError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', workspace.team_id)
      .eq('user_id', user_id)
      .single()

    if (targetError || !targetMembership) {
      return NextResponse.json(
        { error: 'Target user is not a member of this team', success: false },
        { status: 400 }
      )
    }

    // Check for duplicate assignment (workspace + user + phase)
    const { data: existingAssignment, error: existingError } = await supabase
      .from('user_phase_assignments')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user_id)
      .eq('phase', phase)
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing assignment:', existingError)
      return NextResponse.json(
        { error: 'Failed to check existing assignments', details: existingError.message, success: false },
        { status: 500 }
      )
    }

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'This user is already assigned to this phase in this workspace', success: false },
        { status: 400 }
      )
    }

    // Create phase assignment with timestamp-based ID
    const assignmentId = Date.now().toString()
    const { data: assignment, error: assignmentError } = await supabase
      .from('user_phase_assignments')
      .insert({
        id: assignmentId,
        workspace_id,
        user_id,
        phase,
        can_edit,
        notes: notes || null
      })
      .select(`
        id,
        user_id,
        workspace_id,
        phase,
        can_edit,
        notes,
        created_at,
        users:users!user_phase_assignments_user_id_fkey(
          id,
          email,
          name,
          avatar_url
        )
      `)
      .single()

    if (assignmentError) {
      console.error('Error creating phase assignment:', assignmentError)
      return NextResponse.json(
        { error: 'Failed to create phase assignment', details: assignmentError.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: assignment,
      success: true
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/team/phase-assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}
