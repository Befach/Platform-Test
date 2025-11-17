import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/review-links/[id]
 * Get a specific review link by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get review link
    const { data: reviewLink, error: linkError } = await supabase
      .from('review_links')
      .select('*, workspaces(team_id, name)')
      .eq('id', id)
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

    return NextResponse.json(reviewLink)
  } catch (error: any) {
    console.error('Error fetching review link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch review link' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/review-links/[id]
 * Update a review link
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { is_active, expires_at, name } = body

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
      .select('*, workspaces(team_id)')
      .eq('id', id)
      .single()

    if (linkError || !reviewLink) {
      return NextResponse.json(
        { error: 'Review link not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', reviewLink.workspaces.team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update review link
    const updates: any = {}
    if (is_active !== undefined) updates.is_active = is_active
    if (expires_at !== undefined) updates.expires_at = expires_at
    if (name !== undefined) updates.name = name

    const { data: updatedLink, error: updateError } = await supabase
      .from('review_links')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(updatedLink)
  } catch (error: any) {
    console.error('Error updating review link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update review link' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/review-links/[id]
 * Deactivate a review link (soft delete)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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
      .select('*, workspaces(team_id)')
      .eq('id', id)
      .single()

    if (linkError || !reviewLink) {
      return NextResponse.json(
        { error: 'Review link not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', reviewLink.workspaces.team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete: set is_active to false
    const { data: deletedLink, error: deleteError } = await supabase
      .from('review_links')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true, link: deletedLink })
  } catch (error: any) {
    console.error('Error deleting review link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete review link' },
      { status: 500 }
    )
  }
}
