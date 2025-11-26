import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/timeline-items/[id]
 * Get single timeline item by ID
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

    // Fetch timeline item
    const { data: timelineItem, error: fetchError } = await supabase
      .from('timeline_items')
      .select(`
        *,
        work_item:work_items!work_item_id(id, name, type),
        assigned_to_user:users!assigned_to(id, name, email)
      `)
      .eq('id', id)
      .eq('team_id', teamMember.team_id)
      .single()

    if (fetchError || !timelineItem) {
      return NextResponse.json(
        { error: 'Timeline item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(timelineItem, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching timeline item:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch timeline item' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/timeline-items/[id]
 * Update timeline item (including status, progress, assignment, dates, blockers)
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

    // Verify timeline item exists and belongs to team
    const { data: existingItem, error: checkError } = await supabase
      .from('timeline_items')
      .select('id, team_id')
      .eq('id', id)
      .eq('team_id', teamMember.team_id)
      .single()

    if (checkError || !existingItem) {
      return NextResponse.json(
        { error: 'Timeline item not found' },
        { status: 404 }
      )
    }

    const {
      description,
      timeline,
      difficulty,
      estimated_hours,
      category,
      integration_type,
      status,
      phase,
      progress_percent,
      assigned_to,
      planned_start_date,
      planned_end_date,
      actual_start_date,
      actual_end_date,
      actual_hours,
      is_blocked,
      blockers,
    } = body

    // Build update object (only include provided fields)
    const updates: any = { updated_at: new Date().toISOString() }

    if (description !== undefined) updates.description = description
    if (timeline !== undefined) {
      if (!['MVP', 'SHORT', 'LONG'].includes(timeline)) {
        return NextResponse.json(
          { error: 'timeline must be MVP, SHORT, or LONG' },
          { status: 400 }
        )
      }
      updates.timeline = timeline
    }
    if (difficulty !== undefined) {
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return NextResponse.json(
          { error: 'difficulty must be easy, medium, or hard' },
          { status: 400 }
        )
      }
      updates.difficulty = difficulty
    }
    if (estimated_hours !== undefined) updates.estimated_hours = estimated_hours
    if (category !== undefined) updates.category = category
    if (integration_type !== undefined) updates.integration_type = integration_type
    if (status !== undefined) {
      const validStatuses = [
        'not_started',
        'planning',
        'in_progress',
        'blocked',
        'review',
        'completed',
        'on_hold',
        'cancelled',
      ]
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'status must be one of: not_started, planning, in_progress, blocked, review, completed, on_hold, cancelled' },
          { status: 400 }
        )
      }
      updates.status = status
    }
    if (phase !== undefined) {
      const validPhases = ['research', 'planning', 'execution', 'review', 'complete']
      if (!validPhases.includes(phase)) {
        return NextResponse.json(
          { error: 'phase must be one of: research, planning, execution, review, complete' },
          { status: 400 }
        )
      }
      updates.phase = phase
    }
    if (progress_percent !== undefined) {
      if (progress_percent < 0 || progress_percent > 100) {
        return NextResponse.json(
          { error: 'progress_percent must be between 0 and 100' },
          { status: 400 }
        )
      }
      updates.progress_percent = progress_percent
    }
    if (assigned_to !== undefined) updates.assigned_to = assigned_to
    if (planned_start_date !== undefined) updates.planned_start_date = planned_start_date
    if (planned_end_date !== undefined) updates.planned_end_date = planned_end_date
    if (actual_start_date !== undefined) updates.actual_start_date = actual_start_date
    if (actual_end_date !== undefined) updates.actual_end_date = actual_end_date
    if (actual_hours !== undefined) updates.actual_hours = actual_hours
    if (is_blocked !== undefined) updates.is_blocked = is_blocked
    if (blockers !== undefined) updates.blockers = blockers

    // Update timeline item
    const { data: updatedItem, error: updateError } = await supabase
      .from('timeline_items')
      .update(updates)
      .eq('id', id)
      .eq('team_id', teamMember.team_id)
      .select(`
        *,
        work_item:work_items!work_item_id(id, name, type),
        assigned_to_user:users!assigned_to(id, name, email)
      `)
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(updatedItem, { status: 200 })
  } catch (error: any) {
    console.error('Error updating timeline item:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update timeline item' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/timeline-items/[id]
 * Delete timeline item
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

    // Delete timeline item
    const { error: deleteError } = await supabase
      .from('timeline_items')
      .delete()
      .eq('id', id)
      .eq('team_id', teamMember.team_id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting timeline item:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete timeline item' },
      { status: 500 }
    )
  }
}
