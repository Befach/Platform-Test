import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * PUT /api/feedback/[id]
 * Update feedback status
 * Requires authentication - team members only
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { status } = body

    // Validate status
    if (!status || !['new', 'reviewed', 'actioned', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: new, reviewed, actioned, or dismissed' },
        { status: 400 }
      )
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get feedback to verify access
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select(`
        *,
        review_links (
          workspace_id,
          workspaces (
            team_id
          )
        )
      `)
      .eq('id', id)
      .single()

    if (feedbackError || !feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      )
    }

    // Verify user has access (team member)
    const teamId = feedback.review_links.workspaces.team_id
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update feedback status
    const { data: updatedFeedback, error: updateError } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(updatedFeedback)
  } catch (error: any) {
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update feedback' },
      { status: 500 }
    )
  }
}
