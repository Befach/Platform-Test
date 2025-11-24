import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/feedback
 * List feedback with optional filters
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
    const source = searchParams.get('source')
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('feedback')
      .select(`
        *,
        work_item:work_items!work_item_id(id, name, type),
        implemented_in:work_items!implemented_in_id(id, name, type),
        decision_by_user:users!decision_by(id, name, email)
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
    if (source) {
      query = query.eq('source', source)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (search) {
      query = query.or(
        `content.ilike.%${search}%,source_name.ilike.%${search}%,source_email.ilike.%${search}%`
      )
    }

    const { data: feedback, error: fetchError } = await query

    if (fetchError) {
      throw fetchError
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
 * POST /api/feedback
 * Create new feedback
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
      source,
      source_name,
      source_role,
      source_email,
      priority,
      content,
      context,
      received_at,
    } = body

    // Validate required fields
    if (!work_item_id || !workspace_id || !source || !source_name || !content) {
      return NextResponse.json(
        {
          error:
            'work_item_id, workspace_id, source, source_name, and content are required',
        },
        { status: 400 }
      )
    }

    // Validate source type
    if (!['internal', 'customer', 'user'].includes(source)) {
      return NextResponse.json(
        { error: 'source must be internal, customer, or user' },
        { status: 400 }
      )
    }

    // Verify work item exists and belongs to workspace
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

    if (workItem.workspace_id !== workspace_id) {
      return NextResponse.json(
        { error: 'Work item does not belong to workspace' },
        { status: 400 }
      )
    }

    // Auto-suggest priority based on source if not provided
    let finalPriority = priority
    if (!finalPriority) {
      finalPriority = source === 'customer' ? 'high' : 'low'
    }

    // Validate priority
    if (!['high', 'low'].includes(finalPriority)) {
      return NextResponse.json(
        { error: 'priority must be high or low' },
        { status: 400 }
      )
    }

    // Create feedback
    const id = Date.now().toString()
    const feedback = {
      id,
      work_item_id,
      team_id: teamMember.team_id,
      workspace_id,
      source,
      source_name,
      source_role: source_role || null,
      source_email: source_email || null,
      priority: finalPriority,
      content,
      context: context || null,
      received_at: received_at || new Date().toISOString(),
      status: 'pending',
    }

    const { data: newFeedback, error: createError } = await supabase
      .from('feedback')
      .insert(feedback)
      .select(`
        *,
        work_item:work_items!work_item_id(id, name, type),
        implemented_in:work_items!implemented_in_id(id, name, type),
        decision_by_user:users!decision_by(id, name, email)
      `)
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json(newFeedback, { status: 201 })
  } catch (error: any) {
    console.error('Error creating feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create feedback' },
      { status: 500 }
    )
  }
}
