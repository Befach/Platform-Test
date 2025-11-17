import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for accepting invitations
const acceptInvitationSchema = z.object({
  token: z.string()
})

/**
 * POST /api/team/invitations/accept
 * Accept invitation and join team
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
    const validation = acceptInvitationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors, success: false },
        { status: 400 }
      )
    }

    const { token } = validation.data

    // Get invitation by token
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token', success: false },
        { status: 404 }
      )
    }

    // Check if invitation is already accepted
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted', success: false },
        { status: 400 }
      )
    }

    // Check if invitation is expired
    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'This invitation has expired', success: false },
        { status: 400 }
      )
    }

    // Get user's email to verify it matches invitation
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user data:', userError)
      return NextResponse.json(
        { error: 'Failed to verify user', details: userError?.message, success: false },
        { status: 500 }
      )
    }

    // Verify email matches (case-insensitive)
    if (userData.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation is for a different email address', success: false },
        { status: 403 }
      )
    }

    // Check if user is already a member of the team
    const { data: existingMember, error: existingMemberError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', invitation.team_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMemberError) {
      console.error('Error checking existing membership:', existingMemberError)
      return NextResponse.json(
        { error: 'Failed to check team membership', details: existingMemberError.message, success: false },
        { status: 500 }
      )
    }

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this team', success: false },
        { status: 400 }
      )
    }

    // Create team member record with timestamp-based ID
    const teamMemberId = Date.now().toString()
    const { data: teamMember, error: teamMemberError } = await supabase
      .from('team_members')
      .insert({
        id: teamMemberId,
        team_id: invitation.team_id,
        user_id: user.id,
        role: invitation.role
      })
      .select()
      .single()

    if (teamMemberError) {
      console.error('Error creating team member:', teamMemberError)
      return NextResponse.json(
        { error: 'Failed to join team', details: teamMemberError.message, success: false },
        { status: 500 }
      )
    }

    // Create phase assignments if specified in invitation
    if (invitation.phase_assignments && Array.isArray(invitation.phase_assignments) && invitation.phase_assignments.length > 0) {
      const phaseAssignments = invitation.phase_assignments.map((assignment: any) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        workspace_id: assignment.workspace_id,
        user_id: user.id,
        phase: assignment.phase,
        can_edit: assignment.can_edit || false,
        notes: assignment.notes || null
      }))

      const { error: assignmentsError } = await supabase
        .from('user_phase_assignments')
        .insert(phaseAssignments)

      if (assignmentsError) {
        console.error('Error creating phase assignments:', assignmentsError)
        // Don't fail the whole operation, just log the error
        // The user is still added to the team successfully
      }
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ accepted_at: now.toISOString() })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      // Don't fail the operation, the user is already added
    }

    // Get team details for response
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('id', invitation.team_id)
      .single()

    // Get first workspace for redirect (if any)
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('team_id', invitation.team_id)
      .limit(1)
      .single()

    const redirectUrl = workspaces
      ? `/workspaces/${workspaces.id}`
      : `/teams/${invitation.team_id}`

    return NextResponse.json({
      data: {
        team_member: teamMember,
        team: team || { id: invitation.team_id },
        redirect_url: redirectUrl,
        message: 'Successfully joined team'
      },
      success: true
    })

  } catch (error) {
    console.error('Error in POST /api/team/invitations/accept:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}
