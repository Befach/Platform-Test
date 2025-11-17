import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PHASE_ORDER, type WorkspacePhase } from '@/lib/constants/workspace-phases'

/**
 * GET /api/team/phase-analytics?workspace_id=xxx
 * Get phase lead analytics for a workspace
 *
 * Returns:
 * - Lead counts per phase
 * - Phase coverage (which phases have leads)
 * - Lead distribution (who leads which phases)
 * - Team member counts per phase
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

    // Get workspace_id from query params
    const searchParams = request.nextUrl.searchParams
    const workspace_id = searchParams.get('workspace_id')

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required', success: false },
        { status: 400 }
      )
    }

    // Get workspace to verify access and get team_id
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name, team_id')
      .eq('id', workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found', success: false },
        { status: 404 }
      )
    }

    // Check if user is a member of this team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('team_id', workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this team', success: false },
        { status: 403 }
      )
    }

    // Get all phase assignments for this workspace
    const { data: assignments, error: assignmentsError } = await supabase
      .from('user_phase_assignments')
      .select(`
        id,
        user_id,
        phase,
        can_edit,
        is_lead,
        assigned_at,
        users:users!user_phase_assignments_user_id_fkey(
          id,
          email,
          name
        )
      `)
      .eq('workspace_id', workspace_id)
      .order('assigned_at', { ascending: false })

    if (assignmentsError) {
      console.error('Error fetching phase assignments:', assignmentsError)
      return NextResponse.json(
        { error: 'Failed to fetch phase assignments', details: assignmentsError.message, success: false },
        { status: 500 }
      )
    }

    // Calculate analytics
    const leadCounts: Record<WorkspacePhase, number> = {
      research: 0,
      planning: 0,
      execution: 0,
      review: 0,
      complete: 0,
    }

    const contributorCounts: Record<WorkspacePhase, number> = {
      research: 0,
      planning: 0,
      execution: 0,
      review: 0,
      complete: 0,
    }

    const totalMemberCounts: Record<WorkspacePhase, number> = {
      research: 0,
      planning: 0,
      execution: 0,
      review: 0,
      complete: 0,
    }

    // Track leads by phase for detailed breakdown
    const leadsByPhase: Record<WorkspacePhase, any[]> = {
      research: [],
      planning: [],
      execution: [],
      review: [],
      complete: [],
    }

    // Process assignments
    assignments?.forEach((assignment) => {
      const phase = assignment.phase as WorkspacePhase

      if (assignment.is_lead) {
        leadCounts[phase]++
        leadsByPhase[phase].push({
          user_id: assignment.user_id,
          email: assignment.users?.email,
          name: assignment.users?.name,
          assigned_at: assignment.assigned_at,
        })
      } else if (assignment.can_edit) {
        contributorCounts[phase]++
      }

      totalMemberCounts[phase]++
    })

    // Calculate coverage percentage
    const phasesWithLeads = PHASE_ORDER.filter(phase => leadCounts[phase] > 0).length
    const coveragePercentage = (phasesWithLeads / PHASE_ORDER.length) * 100

    // Identify phases needing leads (0 leads or >2 leads)
    const phasesNeedingAttention = PHASE_ORDER.filter(
      phase => leadCounts[phase] === 0 || leadCounts[phase] > 2
    ).map(phase => ({
      phase,
      lead_count: leadCounts[phase],
      issue: leadCounts[phase] === 0 ? 'no_leads' : 'too_many_leads',
    }))

    // Build phase-by-phase breakdown
    const phaseBreakdown = PHASE_ORDER.map(phase => ({
      phase,
      leads: leadCounts[phase],
      contributors: contributorCounts[phase],
      total_members: totalMemberCounts[phase],
      lead_details: leadsByPhase[phase],
      status: leadCounts[phase] === 0
        ? 'needs_lead'
        : leadCounts[phase] > 2
        ? 'too_many_leads'
        : leadCounts[phase] === 1
        ? 'optimal'
        : 'adequate',
    }))

    return NextResponse.json({
      data: {
        workspace_id,
        workspace_name: workspace.name,
        summary: {
          total_phases: PHASE_ORDER.length,
          phases_with_leads: phasesWithLeads,
          coverage_percentage: Math.round(coveragePercentage),
          total_leads: Object.values(leadCounts).reduce((a, b) => a + b, 0),
          total_contributors: Object.values(contributorCounts).reduce((a, b) => a + b, 0),
          total_assignments: assignments?.length || 0,
        },
        lead_counts: leadCounts,
        contributor_counts: contributorCounts,
        total_member_counts: totalMemberCounts,
        phases_needing_attention: phasesNeedingAttention,
        phase_breakdown: phaseBreakdown,
      },
      success: true,
    })

  } catch (error) {
    console.error('Error in GET /api/team/phase-analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    )
  }
}
