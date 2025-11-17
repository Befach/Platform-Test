import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get email from query params
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    // Get user's team to scope the search
    const { data: userTeamMember } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id)
      .single()

    if (!userTeamMember) {
      return NextResponse.json({ error: 'User not in any team' }, { status: 403 })
    }

    const teamId = userTeamMember.team_id

    // Check invitations for this email in the user's team
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('team_id', teamId)
      .eq('email', email)
      .order('created_at', { ascending: false })

    // Check team_members for this team
    const { data: teamMembers, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)

    // Since we don't have a public.users table, we can't easily get emails
    // Just return the raw data for now
    const memberWithEmail = null  // Will check manually in the UI

    // Check phase assignments if member exists
    let phaseAssignments = null
    if (memberWithEmail) {
      const { data: assignments } = await supabase
        .from('user_phase_assignments')
        .select('*')
        .eq('user_id', memberWithEmail.user_id)
    }

    return NextResponse.json({
      email,
      teamId,
      currentUserRole: userTeamMember.role,
      invitations: invitations || [],
      teamMembers: teamMembers || [],
      note: "Team members show user_id instead of email because there's no public.users table",
      errors: {
        invError: invError?.message,
        memberError: memberError?.message,
      },
    })
  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
