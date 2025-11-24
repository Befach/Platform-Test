import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/feedback/[id]
 * Get single feedback by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 })
    }

    // Fetch feedback
    const { data: feedback, error: fetchError } = await supabase
      .from('feedback')
      .select(`
        *,
        work_item:work_items!work_item_id(id, name, type),
        implemented_in:work_items!implemented_in_id(id, name, type),
        decision_by_user:users!decision_by(id, name, email)
      `)
      .eq('id', id)
      .eq('team_id', teamMember.team_id)
      .single()

    if (fetchError || !feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(feedback, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/feedback/[id]
 * Update feedback
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 })
    }

    // Verify feedback exists and belongs to team
    const { data: existingFeedback, error: checkError } = await supabase
      .from('feedback')
      .select('id, team_id')
      .eq('id', id)
      .eq('team_id', teamMember.team_id)
      .single()

    if (checkError || !existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      )
    }

    const {
      source,
      source_name,
      source_role,
      source_email,
      priority,
      content,
      context,
    } = body

    // Build update object (only include provided fields)
    const updates: any = { updated_at: new Date().toISOString() }

    if (source !== undefined) {
      if (!['internal', 'customer', 'user'].includes(source)) {
        return NextResponse.json(
          { error: 'source must be internal, customer, or user' },
          { status: 400 }
        )
      }
      updates.source = source
    }
    if (source_name !== undefined) updates.source_name = source_name
    if (source_role !== undefined) updates.source_role = source_role
    if (source_email !== undefined) updates.source_email = source_email
    if (priority !== undefined) {
      if (!['high', 'low'].includes(priority)) {
        return NextResponse.json(
          { error: 'priority must be high or low' },
          { status: 400 }
        )
      }
      updates.priority = priority
    }
    if (content !== undefined) updates.content = content
    if (context !== undefined) updates.context = context

    // Update feedback
    const { data: updatedFeedback, error: updateError } = await supabase
      .from('feedback')
      .update(updates)
      .eq('id', id)
      .eq('team_id', teamMember.team_id)
      .select(`
        *,
        work_item:work_items!work_item_id(id, name, type),
        implemented_in:work_items!implemented_in_id(id, name, type),
        decision_by_user:users!decision_by(id, name, email)
      `)
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(updatedFeedback, { status: 200 })
  } catch (error: any) {
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update feedback' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/feedback/[id]
 * Delete feedback
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 })
    }

    // Delete feedback
    const { error: deleteError } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id)
      .eq('team_id', teamMember.team_id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete feedback' },
      { status: 500 }
    )
  }
}
