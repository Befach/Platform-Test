import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { WorkItemDetailShell } from '@/components/work-item-detail'
import type { WorkItemData, TimelineItemData } from '@/components/work-item-detail'

export default async function WorkItemDetailPage({
  params,
}: {
  params: Promise<{ id: string; workItemId: string }>
}) {
  const { id: workspaceId, workItemId } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get work item details with workspace info
  // Note: Schema uses 'owner' not 'assigned_to', and 'purpose' not 'description'
  const { data: workItem, error: workItemError } = await supabase
    .from('work_items')
    .select(`
      *,
      workspace:workspace_id (
        id,
        name,
        icon,
        phase,
        team_id
      )
    `)
    .eq('id', workItemId)
    .single()

  if (workItemError || !workItem) {
    notFound()
  }

  // Check if user is a member of this team
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', workItem.workspace.team_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/dashboard')
  }

  // Get timeline items
  const { data: timelineItems } = await supabase
    .from('timeline_items')
    .select('*')
    .eq('work_item_id', workItemId)
    .order('order_index', { ascending: true })

  // Get task count for this work item
  const { count: taskCount } = await supabase
    .from('product_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('work_item_id', workItemId)

  // Get feedback count for this work item
  const { count: feedbackCount } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true })
    .eq('work_item_id', workItemId)

  // Check if this work item has been enhanced by others (for version tab visibility)
  const { count: enhancementCount } = await supabase
    .from('work_items')
    .select('*', { count: 'exact', head: true })
    .eq('enhances_work_item_id', workItemId)

  // Transform data to match component types
  // Note: Database uses 'name' (not 'title'), 'purpose' (not 'description'), 'owner' (not 'assigned_to')
  const workItemData: WorkItemData = {
    id: workItem.id,
    title: workItem.name,
    description: workItem.purpose || null,
    phase: workItem.phase,
    status: workItem.phase, // Backward compat - maps to phase
    priority: workItem.priority,
    type: workItem.type,
    assigned_to: workItem.owner || null,
    created_by: workItem.created_by || null,
    created_at: workItem.created_at,
    updated_at: workItem.updated_at,
    workspace_id: workItem.workspace_id,
    team_id: workItem.workspace.team_id,
    workspace: workItem.workspace,
    assigned_to_user: null, // Not implemented yet - would need FK to users table
    created_by_user: null, // Not implemented yet - would need FK to users table
    // Versioning fields
    version: workItem.version || 1,
    enhances_work_item_id: workItem.enhances_work_item_id || null,
    version_notes: workItem.version_notes || null,
    // Additional fields from new schema
    department_id: workItem.department_id || null,
    is_enhancement: workItem.is_enhancement || false,
    review_enabled: workItem.review_enabled || false,
    review_status: workItem.review_status || null,
  }

  const timelineItemsData: TimelineItemData[] = (timelineItems || []).map(
    (item) => ({
      id: item.id,
      work_item_id: item.work_item_id,
      title: item.title || '',
      description: item.description,
      timeline: item.timeline as 'MVP' | 'SHORT' | 'LONG',
      difficulty: item.difficulty || 'medium',
      phase: item.phase,
      status: item.status,
      order_index: item.order_index,
      estimated_hours: item.estimated_hours,
      actual_hours: item.actual_hours,
      completed_at: item.completed_at,
      created_at: item.created_at,
      planned_start_date: item.planned_start_date,
      planned_end_date: item.planned_end_date,
    })
  )

  return (
    <WorkItemDetailShell
      workItem={workItemData}
      timelineItems={timelineItemsData}
      taskCount={taskCount || 0}
      feedbackCount={feedbackCount || 0}
      hasEnhancements={(enhancementCount || 0) > 0}
    />
  )
}
