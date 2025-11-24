import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/timeline-items
 * List timeline items with optional filters
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

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

    // Parse filters
    const workItemId = searchParams.get('work_item_id')
    const workspaceId = searchParams.get('workspace_id')
    const timeline = searchParams.get('timeline')
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assigned_to')
    const isBlocked = searchParams.get('is_blocked')

    // Build query
    let query = supabase
      .from('timeline_items')
      .select(`
        *,
        work_item:work_items!work_item_id(id, name, type),
        assigned_to_user:users!assigned_to(id, name, email)
      `)
      .eq('team_id', teamMember.team_id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (workItemId) {
      query = query.eq('work_item_id', workItemId)
    }
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }
    if (timeline) {
      query = query.eq('timeline', timeline)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }
    if (isBlocked !== null) {
      query = query.eq('is_blocked', isBlocked === 'true')
    }

    const { data: timelineItems, error: fetchError } = await query

    if (fetchError) {
      throw fetchError
    }

    return NextResponse.json(timelineItems, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching timeline items:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch timeline items' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/timeline-items
 * Create new timeline item
 */
export async function POST(request: Request) {
  try {
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

    const {
      work_item_id,
      workspace_id,
      timeline,
      difficulty,
      description,
      estimated_hours,
      category,
      integration_type,
      planned_start_date,
      planned_end_date,
      assigned_to,
      status,
    } = body

    // Validate required fields
    if (!work_item_id || !timeline || !difficulty) {
      return NextResponse.json(
        { error: 'work_item_id, timeline, and difficulty are required' },
        { status: 400 }
      )
    }

    // Validate timeline
    if (!['MVP', 'SHORT', 'LONG'].includes(timeline)) {
      return NextResponse.json(
        { error: 'timeline must be MVP, SHORT, or LONG' },
        { status: 400 }
      )
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'difficulty must be easy, medium, or hard' },
        { status: 400 }
      )
    }

    // Verify work item exists and belongs to team
    const { data: workItem, error: workItemError } = await supabase
      .from('work_items')
      .select('id, workspace_id, team_id')
      .eq('id', work_item_id)
      .eq('team_id', teamMember.team_id)
      .single()

    if (workItemError || !workItem) {
      return NextResponse.json(
        { error: 'Work item not found' },
        { status: 404 }
      )
    }

    // Create timeline item
    const id = Date.now().toString()
    const timelineItem = {
      id,
      work_item_id,
      team_id: teamMember.team_id,
      workspace_id: workspace_id || workItem.workspace_id,
      user_id: user.id,
      timeline,
      difficulty,
      description: description || null,
      estimated_hours: estimated_hours || null,
      category: category || null,
      integration_type: integration_type || null,
      planned_start_date: planned_start_date || null,
      planned_end_date: planned_end_date || null,
      assigned_to: assigned_to || null,
      status: status || 'not_started',
      progress_percent: 0,
      is_blocked: false,
      blockers: [],
    }

    const { data: newTimelineItem, error: createError } = await supabase
      .from('timeline_items')
      .insert(timelineItem)
      .select(`
        *,
        work_item:work_items!work_item_id(id, name, type),
        assigned_to_user:users!assigned_to(id, name, email)
      `)
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json(newTimelineItem, { status: 201 })
  } catch (error: any) {
    console.error('Error creating timeline item:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create timeline item' },
      { status: 500 }
    )
  }
}
