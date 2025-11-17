import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/team/invitations/details
 * Fetch invitation details by token (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get token from query params
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }

    // Fetch invitation with team details
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select(
        `
        id,
        team_id,
        email,
        role,
        expires_at,
        created_at,
        phase_assignments,
        teams!inner (
          name
        ),
        invited_by_user:users!team_invitations_invited_by_fkey (
          name,
          email
        )
      `
      )
      .eq('token', token)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 })
    }

    // Check if expired
    const isExpired = new Date(invitation.expires_at) < new Date()

    // Parse phase assignments to group by workspace
    const phaseAssignments = (invitation.phase_assignments || []) as Array<{
      workspace_id: string
      phase: string
      can_edit: boolean
    }>

    // Fetch workspace details for phase assignments
    const workspaceIds = [...new Set(phaseAssignments.map((pa) => pa.workspace_id))]
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name')
      .in('id', workspaceIds)

    const workspaceMap = new Map(workspaces?.map((w) => [w.id, w.name]) || [])

    // Group phases by workspace
    const workspaceAccess = workspaceIds.map((workspaceId) => ({
      name: workspaceMap.get(workspaceId) || 'Unknown Workspace',
      phases: phaseAssignments
        .filter((pa) => pa.workspace_id === workspaceId)
        .map((pa) => pa.phase),
    }))

    // Return invitation details
    return NextResponse.json({
      team_name: invitation.teams.name,
      inviter_name: invitation.invited_by_user?.name || null,
      inviter_email: invitation.invited_by_user?.email || '',
      role: invitation.role,
      workspaces: workspaceAccess,
      expires_at: invitation.expires_at,
      is_expired: isExpired,
    })
  } catch (error) {
    console.error('Error in GET /api/team/invitations/details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
