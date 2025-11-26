/**
 * Product Tasks Stats API Route
 *
 * Get task statistics for a workspace.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  validatePhasePermission,
  handlePermissionError,
} from '@/lib/middleware/permission-middleware'

/**
 * GET /api/product-tasks/stats
 *
 * Get task statistics for a workspace.
 * Query params: workspace_id (required), team_id (required)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get('workspace_id')
    const teamId = searchParams.get('team_id')

    if (!workspaceId || !teamId) {
      return NextResponse.json(
        { error: 'workspace_id and team_id are required' },
        { status: 400 }
      )
    }

    // Validate view permission
    await validatePhasePermission({
      workspaceId,
      teamId,
      phase: 'execution',
      action: 'view',
    })

    // Fetch all tasks for the workspace
    const { data: tasks, error } = await supabase
      .from('product_tasks')
      .select('id, status, task_type, work_item_id, due_date')
      .eq('workspace_id', workspaceId)
      .eq('team_id', teamId)

    if (error) {
      console.error('Error fetching task stats:', error)
      return NextResponse.json({ error: 'Failed to fetch task stats' }, { status: 500 })
    }

    const now = new Date()

    // Calculate stats
    const stats = {
      total: tasks.length,
      by_status: {
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        done: tasks.filter(t => t.status === 'done').length,
      },
      by_type: {
        research: tasks.filter(t => t.task_type === 'research').length,
        design: tasks.filter(t => t.task_type === 'design').length,
        development: tasks.filter(t => t.task_type === 'development').length,
        qa: tasks.filter(t => t.task_type === 'qa').length,
        marketing: tasks.filter(t => t.task_type === 'marketing').length,
        ops: tasks.filter(t => t.task_type === 'ops').length,
        admin: tasks.filter(t => t.task_type === 'admin').length,
      },
      standalone_count: tasks.filter(t => !t.work_item_id).length,
      linked_count: tasks.filter(t => t.work_item_id).length,
      overdue_count: tasks.filter(t =>
        t.due_date &&
        new Date(t.due_date) < now &&
        t.status !== 'done'
      ).length,
      completion_percentage: tasks.length > 0
        ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
        : 0,
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    return handlePermissionError(error)
  }
}
