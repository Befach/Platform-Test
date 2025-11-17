import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for updating member role
const updateMemberSchema = z.object({
  role: z.enum(['owner', 'admin', 'member'])
})

/**
 * PATCH /api/team/members/[id]
 * Update team member role
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
    const validation = updateMemberSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors, success: false },
        { status: 400 }
      )
    }

    const { role: newRole } = validation.data
    const memberId = params.id

    // Get target member details
    const { data: targetMember, error: targetMemberError } = await supabase
      .from('team_members')
      .select('id, team_id, user_id, role')
      .eq('id', memberId)
      .single()

    if (targetMemberError || !targetMember) {
      return NextResponse.json(
        { error: 'Team member not found', success: false },
        { status: 404 }
      )
    }

    // Check if user is trying to change their own role
    if (targetMember.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot change your own role', success: false },
        { status: 400 }
      )
    }

    // Check if requesting user is owner of the team
    const { data: requesterMembership, error: requesterError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', targetMember.team_id)
      .eq('user_id', user.id)
      .single()

    if (requesterError || !requesterMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this team', success: false },
        { status: 403 }
      )
    }

    if (requesterMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can change member roles', success: false },
        { status: 403 }
      )
    }

    // If demoting from owner, check if there's at least one other owner
    if (targetMember.role === 'owner' && newRole !== 'owner') {
      const { data: owners, error: ownersError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', targetMember.team_id)
        .eq('role', 'owner')

      if (ownersError) {
        console.error('Error checking owners:', ownersError)
        return NextResponse.json(
          { error: 'Failed to verify team ownership', details: ownersError.message, success: false },
          { status: 500 }
        )
      }

      if (owners.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last owner of the team', success: false },
          { status: 400 }
        )
      }
    }

    // Update member role
    const { data: updatedMember, error: updateError } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .select(`
        id,
        role,
        created_at,
        user:users!team_members_user_id_fkey(
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating team member:', updateError)
      return NextResponse.json(
        { error: 'Failed to update team member', details: updateError.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: updatedMember,
      success: true
    })

  } catch (error) {
    console.error('Error in PATCH /api/team/members/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/team/members/[id]
 * Remove team member from team
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

    const memberId = params.id

    // Get target member details
    const { data: targetMember, error: targetMemberError } = await supabase
      .from('team_members')
      .select('id, team_id, user_id, role')
      .eq('id', memberId)
      .single()

    if (targetMemberError || !targetMember) {
      return NextResponse.json(
        { error: 'Team member not found', success: false },
        { status: 404 }
      )
    }

    // Check if user is trying to remove themselves (should use leave team endpoint)
    if (targetMember.user_id === user.id) {
      return NextResponse.json(
        { error: 'Use the leave team endpoint to remove yourself', success: false },
        { status: 400 }
      )
    }

    // Check if requesting user has permission to remove members
    const { data: requesterMembership, error: requesterError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', targetMember.team_id)
      .eq('user_id', user.id)
      .single()

    if (requesterError || !requesterMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this team', success: false },
        { status: 403 }
      )
    }

    // Owners can remove anyone, admins can only remove members
    if (requesterMembership.role === 'owner') {
      // Owner can remove anyone
    } else if (requesterMembership.role === 'admin') {
      // Admin can only remove members
      if (targetMember.role !== 'member') {
        return NextResponse.json(
          { error: 'Admins can only remove members, not owners or admins', success: false },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Only owners and admins can remove team members', success: false },
        { status: 403 }
      )
    }

    // If removing an owner, check if there's at least one other owner
    if (targetMember.role === 'owner') {
      const { data: owners, error: ownersError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', targetMember.team_id)
        .eq('role', 'owner')

      if (ownersError) {
        console.error('Error checking owners:', ownersError)
        return NextResponse.json(
          { error: 'Failed to verify team ownership', details: ownersError.message, success: false },
          { status: 500 }
        )
      }

      if (owners.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner of the team', success: false },
          { status: 400 }
        )
      }
    }

    // Delete phase assignments first (cascade should handle this, but explicit is better)
    const { error: assignmentsDeleteError } = await supabase
      .from('user_phase_assignments')
      .delete()
      .eq('user_id', targetMember.user_id)
      .in('workspace_id',
        supabase
          .from('workspaces')
          .select('id')
          .eq('team_id', targetMember.team_id)
      )

    if (assignmentsDeleteError) {
      console.error('Error deleting phase assignments:', assignmentsDeleteError)
      // Don't fail the operation, let cascade handle it
    }

    // Delete team member
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error('Error deleting team member:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove team member', details: deleteError.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { message: 'Team member removed successfully' },
      success: true
    })

  } catch (error) {
    console.error('Error in DELETE /api/team/members/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}
