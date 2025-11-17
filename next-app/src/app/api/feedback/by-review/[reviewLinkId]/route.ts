import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/feedback/by-review/[reviewLinkId]
 * Get all feedback for a specific review link
 * Requires authentication - team members only
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reviewLinkId: string }> }
) {
  try {
    const supabase = await createClient()
    const { reviewLinkId } = await params

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get review link to verify access
    const { data: reviewLink, error: linkError } = await supabase
      .from('review_links')
      .select('*, workspaces(team_id, name)')
      .eq('id', reviewLinkId)
      .single()

    if (linkError || !reviewLink) {
      return NextResponse.json(
        { error: 'Review link not found' },
        { status: 404 }
      )
    }

    // Verify user has access (team member)
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', reviewLink.workspaces.team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all feedback for this review link
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select(`
        *,
        work_items (
          id,
          name,
          description
        )
      `)
      .eq('review_link_id', reviewLinkId)
      .order('created_at', { ascending: false })

    if (feedbackError) {
      throw feedbackError
    }

    // Calculate summary statistics
    const summary = {
      total_feedback: feedback?.length || 0,
      average_rating: feedback && feedback.length > 0
        ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.filter(f => f.rating).length
        : null,
      status_breakdown: {
        new: feedback?.filter(f => f.status === 'new').length || 0,
        reviewed: feedback?.filter(f => f.status === 'reviewed').length || 0,
        actioned: feedback?.filter(f => f.status === 'actioned').length || 0,
        dismissed: feedback?.filter(f => f.status === 'dismissed').length || 0,
      },
    }

    return NextResponse.json({
      feedback: feedback || [],
      summary,
    })
  } catch (error: any) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}
