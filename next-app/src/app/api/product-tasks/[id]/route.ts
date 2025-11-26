/**
 * Product Task Detail API Routes
 *
 * Individual product task operations (get, update, delete).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  validatePhasePermission,
  handlePermissionError,
} from '@/lib/middleware/permission-middleware'

/**
 * GET /api/product-tasks/[id]
 *
 * Get a single product task.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Fetch task with relations
    const { data: task, error } = await supabase
      .from('product_tasks')
      .select(`
        *,
        assigned_user:users!product_tasks_assigned_to_fkey(id, email, name, avatar_url),
        created_by_user:users!product_tasks_created_by_fkey(id, email, name),
        work_item:work_items(id, name, type, status),
        timeline_item:timeline_items(id, name, timeframe, phase)
      `)
      .eq('id', id)
      .single()

    if (error || !task) {
      return NextResponse.json({ error: 'Product task not found' }, { status: 404 })
    }

    // Validate view permission
    await validatePhasePermission({
      workspaceId: task.workspace_id,
      teamId: task.team_id,
      phase: 'execution',
      action: 'view',
    })

    return NextResponse.json({ data: task })
  } catch (error) {
    return handlePermissionError(error)
  }
}

/**
 * PATCH /api/product-tasks/[id]
 *
 * Update a product task.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await req.json()

    // 1. Fetch current task
    const { data: currentTask, error: fetchError } = await supabase
      .from('product_tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentTask) {
      return NextResponse.json({ error: 'Product task not found' }, { status: 404 })
    }

    // 2. Validate edit permission
    await validatePhasePermission({
      workspaceId: currentTask.workspace_id,
      teamId: currentTask.team_id,
      phase: 'execution',
      action: 'edit',
    })

    // 3. Validate task_type if being updated
    const validTaskTypes = ['research', 'design', 'development', 'qa', 'marketing', 'ops', 'admin']
    if (body.task_type && !validTaskTypes.includes(body.task_type)) {
      return NextResponse.json(
        { error: `task_type must be one of: ${validTaskTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // 4. Validate status if being updated
    const validStatuses = ['todo', 'in_progress', 'done']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // 5. If work_item_id is being set, validate it exists
    if (body.work_item_id !== undefined && body.work_item_id !== null) {
      const { data: workItem, error: workItemError } = await supabase
        .from('work_items')
        .select('id')
        .eq('id', body.work_item_id)
        .eq('workspace_id', currentTask.workspace_id)
        .single()

      if (workItemError || !workItem) {
        return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
      }
    }

    // 5b. If timeline_item_id is being set, validate it exists
    if (body.timeline_item_id !== undefined && body.timeline_item_id !== null) {
      const { data: timelineItem, error: timelineItemError } = await supabase
        .from('timeline_items')
        .select('id')
        .eq('id', body.timeline_item_id)
        .single()

      if (timelineItemError || !timelineItem) {
        return NextResponse.json({ error: 'Timeline item not found' }, { status: 404 })
      }
    }

    // 6. Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Only include fields that are being updated
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.task_type !== undefined) updateData.task_type = body.task_type
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to
    if (body.due_date !== undefined) updateData.due_date = body.due_date
    if (body.estimated_hours !== undefined) updateData.estimated_hours = body.estimated_hours
    if (body.actual_hours !== undefined) updateData.actual_hours = body.actual_hours
    if (body.order_index !== undefined) updateData.order_index = body.order_index
    if (body.work_item_id !== undefined) updateData.work_item_id = body.work_item_id
    if (body.timeline_item_id !== undefined) updateData.timeline_item_id = body.timeline_item_id

    // 7. Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from('product_tasks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        assigned_user:users!product_tasks_assigned_to_fkey(id, email, name, avatar_url),
        created_by_user:users!product_tasks_created_by_fkey(id, email, name),
        work_item:work_items(id, name, type, status),
        timeline_item:timeline_items(id, name, timeframe, phase)
      `)
      .single()

    if (updateError) {
      console.error('Error updating product task:', updateError)
      return NextResponse.json({ error: 'Failed to update product task' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedTask })
  } catch (error) {
    return handlePermissionError(error)
  }
}

/**
 * DELETE /api/product-tasks/[id]
 *
 * Delete a product task.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 1. Fetch task
    const { data: task, error: fetchError } = await supabase
      .from('product_tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !task) {
      return NextResponse.json({ error: 'Product task not found' }, { status: 404 })
    }

    // 2. Validate delete permission
    await validatePhasePermission({
      workspaceId: task.workspace_id,
      teamId: task.team_id,
      phase: 'execution',
      action: 'delete',
    })

    // 3. Delete task
    const { error: deleteError } = await supabase
      .from('product_tasks')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting product task:', deleteError)
      return NextResponse.json({ error: 'Failed to delete product task' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Product task deleted successfully' })
  } catch (error) {
    return handlePermissionError(error)
  }
}
