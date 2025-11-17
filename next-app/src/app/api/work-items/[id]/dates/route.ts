import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { start_date, end_date } = body

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      )
    }

    // Validate dates
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'end_date must be after start_date' },
        { status: 400 }
      )
    }

    // Get the work item to verify team membership
    const { data: workItem, error: workItemError } = await supabase
      .from('work_items')
      .select('workspace_id, workspaces!inner(team_id)')
      .eq('id', id)
      .single()

    if (workItemError || !workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    // Verify user is a team member
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', (workItem.workspaces as any).team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the work item dates (duration_days is calculated by trigger)
    const { data: updatedItem, error: updateError } = await supabase
      .from('work_items')
      .update({
        start_date,
        end_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating work item:', updateError)
      return NextResponse.json(
        { error: 'Failed to update work item' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedItem)
  } catch (error: any) {
    console.error('Error in PATCH /api/work-items/[id]/dates:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
