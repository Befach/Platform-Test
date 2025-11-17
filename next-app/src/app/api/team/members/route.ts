import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/team/members?team_id=xxx
 * List all team members with their phase assignments
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

    // Get team_id from query params
    const searchParams = request.nextUrl.searchParams
    const team_id = searchParams.get('team_id')

    if (!team_id) {
      return NextResponse.json(
        { error: 'team_id is required', success: false },
        { status: 400 }
      )
    }

    // Check if user is a member of the team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this team', success: false },
        { status: 403 }
      )
    }

    // Get all team members with user details
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        users:users!team_members_user_id_fkey(
          id,
          email,
          name,
          avatar_url
        )
      `)
      .eq('team_id', team_id)
      .order('joined_at', { ascending: true })

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch team members', details: membersError.message, success: false },
        { status: 500 }
      )
    }

    // Get phase assignments for all members
    const userIds = members.map(m => m.users.id)
    const { data: phaseAssignments, error: assignmentsError } = await supabase
      .from('user_phase_assignments')
      .select(`
        id,
        user_id,
        workspace_id,
        phase,
        can_edit,
        notes,
        created_at,
        workspace:workspaces!inner(id, name)
      `)
      .in('user_id', userIds)
      .eq('workspaces.team_id', team_id)

    if (assignmentsError) {
      console.error('Error fetching phase assignments:', assignmentsError)
      // Don't fail the request, just return members without assignments
    }

    // Combine members with their phase assignments
    // Match TypeScript interface: TeamMemberWithPhases
    const membersWithPhases = members.map(member => ({
      id: member.id,
      user_id: member.user_id,
      team_id: team_id,
      role: member.role,
      joined_at: member.joined_at,
      users: member.users,
      phase_assignments: phaseAssignments?.filter(pa => pa.user_id === member.users.id) || []
    }))

    return NextResponse.json({
      data: membersWithPhases,
      success: true
    })

  } catch (error) {
    console.error('Error in GET /api/team/members:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}
