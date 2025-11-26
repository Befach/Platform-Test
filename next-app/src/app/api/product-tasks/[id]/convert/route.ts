/**
 * Task to Work Item Conversion API
 *
 * Convert a standalone product task to a full work item.
 * This promotes a task to a proper trackable work item with phases.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  validatePhasePermission,
  handlePermissionError,
} from '@/lib/middleware/permission-middleware'

/**
 * POST /api/product-tasks/[id]/convert
 *
 * Convert a product task to a work item.
 * The task is deleted and a new work item is created with the task's data.
 *
 * Body:
 * - type: WorkItemType (concept, feature, bug, enhancement)
 * - keep_task: boolean - if true, keep the task linked to the new work item
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await req.json()

    const { type = 'feature', keep_task = false } = body

    // 1. Validate work item type
    const validTypes = ['concept', 'feature', 'bug', 'enhancement']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // 2. Fetch the task
    const { data: task, error: taskError } = await supabase
      .from('product_tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // 3. Check if task is already linked to a work item
    if (task.work_item_id) {
      return NextResponse.json(
        { error: 'Task is already linked to a work item. Cannot convert.' },
        { status: 400 }
      )
    }

    // 4. Validate permission (planning phase for creating work items)
    const user = await validatePhasePermission({
      workspaceId: task.workspace_id,
      teamId: task.team_id,
      phase: 'planning',
      action: 'edit',
    })

    // 5. Create the work item
    const workItemId = Date.now().toString()
    const { data: workItem, error: workItemError } = await supabase
      .from('work_items')
      .insert({
        id: workItemId,
        workspace_id: task.workspace_id,
        team_id: task.team_id,
        name: task.title,
        purpose: task.description || '',
        type,
        status: task.status === 'done' ? 'completed' : 'planning',
        phase: 'planning',
        priority: task.priority,
        estimated_hours: task.estimated_hours,
        created_by: user.id,
        converted_from_type: 'task',
        converted_from_id: task.id,
        converted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (workItemError) {
      console.error('Error creating work item:', workItemError)
      return NextResponse.json(
        { error: 'Failed to create work item from task' },
        { status: 500 }
      )
    }

    // 6. Either delete the task or link it to the new work item
    if (keep_task) {
      // Link task to new work item
      const { error: linkError } = await supabase
        .from('product_tasks')
        .update({
          work_item_id: workItemId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (linkError) {
        console.error('Error linking task to work item:', linkError)
        // Non-fatal - work item was created
      }
    } else {
      // Delete the task
      const { error: deleteError } = await supabase
        .from('product_tasks')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting task after conversion:', deleteError)
        // Non-fatal - work item was created
      }
    }

    return NextResponse.json({
      data: {
        work_item: workItem,
        task_deleted: !keep_task,
        task_linked: keep_task,
      },
      message: keep_task
        ? 'Task converted to work item and linked'
        : 'Task converted to work item and deleted',
    })
  } catch (error) {
    return handlePermissionError(error)
  }
}
