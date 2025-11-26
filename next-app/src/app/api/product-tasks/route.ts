/**
 * Product Tasks API Routes
 *
 * CRUD operations for product tasks (two-track system).
 * Tasks can be standalone OR linked to work items.
 *
 * Security layers:
 * 1. Authentication: User must be logged in
 * 2. Team membership: User must be team member
 * 3. RLS: Database enforces final access control
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  validatePhasePermission,
  handlePermissionError,
} from '@/lib/middleware/permission-middleware'

/**
 * GET /api/product-tasks
 *
 * List product tasks with optional filters.
 * Filters: workspace_id (required), team_id (required), work_item_id, status, task_type, assigned_to
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get('workspace_id')
    const teamId = searchParams.get('team_id')
    const workItemId = searchParams.get('work_item_id')
    const timelineItemId = searchParams.get('timeline_item_id') // NEW: Filter by timeline item
    const status = searchParams.get('status')
    const taskType = searchParams.get('task_type')
    const assignedTo = searchParams.get('assigned_to')
    const standalone = searchParams.get('standalone') // 'true' to get only standalone tasks

    if (!workspaceId || !teamId) {
      return NextResponse.json(
        { error: 'workspace_id and team_id are required' },
        { status: 400 }
      )
    }

    // Validate view permission (execution phase for tasks)
    await validatePhasePermission({
      workspaceId,
      teamId,
      phase: 'execution',
      action: 'view',
    })

    // Build query with timeline_item relation
    let query = supabase
      .from('product_tasks')
      .select(`
        *,
        assigned_user:users!product_tasks_assigned_to_fkey(id, email, name, avatar_url),
        created_by_user:users!product_tasks_created_by_fkey(id, email, name),
        timeline_item:timeline_items(id, name, timeframe, phase)
      `)
      .eq('workspace_id', workspaceId)
      .eq('team_id', teamId)

    // Apply filters
    if (workItemId) {
      query = query.eq('work_item_id', workItemId)
    }
    if (timelineItemId) {
      query = query.eq('timeline_item_id', timelineItemId)
    }
    if (standalone === 'true') {
      // Standalone = no work_item_id AND no timeline_item_id
      query = query.is('work_item_id', null).is('timeline_item_id', null)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (taskType) {
      query = query.eq('task_type', taskType)
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    // Order by order_index then created_at
    query = query.order('order_index', { ascending: true }).order('created_at', { ascending: false })

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching product tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch product tasks' }, { status: 500 })
    }

    return NextResponse.json({ data: tasks })
  } catch (error) {
    return handlePermissionError(error)
  }
}

/**
 * POST /api/product-tasks
 *
 * Create a new product task.
 * Requires edit permission for execution phase.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const {
      workspace_id,
      team_id,
      work_item_id, // Optional - null for standalone tasks (feature level)
      timeline_item_id, // Optional - null for work-item or standalone tasks (MVP/SHORT/LONG level)
      title,
      description,
      status,
      task_type,
      priority,
      assigned_to,
      due_date,
      estimated_hours,
      order_index,
    } = body

    if (!workspace_id || !team_id || !title) {
      return NextResponse.json(
        { error: 'workspace_id, team_id, and title are required' },
        { status: 400 }
      )
    }

    // Validate task_type if provided
    const validTaskTypes = ['research', 'design', 'development', 'qa', 'marketing', 'ops', 'admin']
    if (task_type && !validTaskTypes.includes(task_type)) {
      return NextResponse.json(
        { error: `task_type must be one of: ${validTaskTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate status if provided
    const validStatuses = ['todo', 'in_progress', 'done']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate edit permission for execution phase
    const user = await validatePhasePermission({
      workspaceId: workspace_id,
      teamId: team_id,
      phase: 'execution',
      action: 'edit',
    })

    // If work_item_id is provided, validate it exists
    if (work_item_id) {
      const { data: workItem, error: workItemError } = await supabase
        .from('work_items')
        .select('id')
        .eq('id', work_item_id)
        .eq('workspace_id', workspace_id)
        .single()

      if (workItemError || !workItem) {
        return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
      }
    }

    // If timeline_item_id is provided, validate it exists
    if (timeline_item_id) {
      const { data: timelineItem, error: timelineItemError } = await supabase
        .from('timeline_items')
        .select('id, work_item_id')
        .eq('id', timeline_item_id)
        .single()

      if (timelineItemError || !timelineItem) {
        return NextResponse.json({ error: 'Timeline item not found' }, { status: 404 })
      }
    }

    // Create task
    const { data: task, error } = await supabase
      .from('product_tasks')
      .insert({
        id: Date.now().toString(),
        workspace_id,
        team_id,
        work_item_id: work_item_id ?? null,
        timeline_item_id: timeline_item_id ?? null,
        title,
        description: description ?? null,
        status: status ?? 'todo',
        task_type: task_type ?? 'development',
        priority: priority ?? 'medium',
        assigned_to: assigned_to ?? null,
        due_date: due_date ?? null,
        estimated_hours: estimated_hours ?? null,
        order_index: order_index ?? 0,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        assigned_user:users!product_tasks_assigned_to_fkey(id, email, name, avatar_url),
        created_by_user:users!product_tasks_created_by_fkey(id, email, name),
        timeline_item:timeline_items(id, name, timeframe, phase)
      `)
      .single()

    if (error) {
      console.error('Error creating product task:', error)
      return NextResponse.json({ error: 'Failed to create product task' }, { status: 500 })
    }

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    return handlePermissionError(error)
  }
}
