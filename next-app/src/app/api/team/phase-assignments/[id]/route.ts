import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for updating phase assignments
const updatePhaseAssignmentSchema = z.object({
  can_edit: z.boolean().optional(),
  notes: z.string().optional()
})

/**
 * PATCH /api/team/phase-assignments/[id]
 * Update phase assignment (toggle can_edit or change notes)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validation = updatePhaseAssignmentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors, success: false },
        { status: 400 }
      )
    }

    const assignmentId = params.id
    const updates = validation.data

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided', success: false },
        { status: 400 }
      )
    }

    // Get assignment details with workspace info
    const { data: assignment, error: assignmentError } = await supabase
      .from('user_phase_assignments')
      .select(`
        id,
        workspace_id,
        workspace:workspaces!inner(id, team_id)
      `)
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Phase assignment not found', success: false },
        { status: 404 }
      )
    }

    // Check if requesting user is owner or admin
    const { data: requesterMembership, error: requesterError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', assignment.workspace.team_id)
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
        { error: 'Only owners and admins can update phase assignments', success: false },
        { status: 403 }
      )
    }

    // Update phase assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('user_phase_assignments')
      .update(updates)
      .eq('id', assignmentId)
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

    if (updateError) {
      console.error('Error updating phase assignment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update phase assignment', details: updateError.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: updatedAssignment,
      success: true
    })

  } catch (error) {
    console.error('Error in PATCH /api/team/phase-assignments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/team/phase-assignments/[id]
 * Remove phase assignment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const assignmentId = params.id

    // Get assignment details with workspace info
    const { data: assignment, error: assignmentError } = await supabase
      .from('user_phase_assignments')
      .select(`
        id,
        workspace_id,
        workspace:workspaces!inner(id, team_id)
      `)
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Phase assignment not found', success: false },
        { status: 404 }
      )
    }

    // Check if requesting user is owner or admin
    const { data: requesterMembership, error: requesterError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', assignment.workspace.team_id)
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
        { error: 'Only owners and admins can delete phase assignments', success: false },
        { status: 403 }
      )
    }

    // Delete phase assignment
    const { error: deleteError } = await supabase
      .from('user_phase_assignments')
      .delete()
      .eq('id', assignmentId)

    if (deleteError) {
      console.error('Error deleting phase assignment:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete phase assignment', details: deleteError.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { message: 'Phase assignment removed successfully' },
      success: true
    })

  } catch (error) {
    console.error('Error in DELETE /api/team/phase-assignments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}
