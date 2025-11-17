import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/team/invitations/[id]
 * Cancel a pending invitation
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

    const invitationId = params.id

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('id, team_id, invited_by, accepted_at')
      .eq('id', invitationId)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found', success: false },
        { status: 404 }
      )
    }

    // Check if invitation is already accepted
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'Cannot cancel an accepted invitation', success: false },
        { status: 400 }
      )
    }

    // Check if user is the inviter OR owner/admin of the team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', invitation.team_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this team', success: false },
        { status: 403 }
      )
    }

    const isInviter = invitation.invited_by === user.id
    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin'

    if (!isInviter && !isOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel this invitation', success: false },
        { status: 403 }
      )
    }

    // Delete the invitation (hard delete)
    const { error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId)

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete invitation', details: deleteError.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { message: 'Invitation cancelled successfully' },
      success: true
    })

  } catch (error) {
    console.error('Error in DELETE /api/team/invitations/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}
