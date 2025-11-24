import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/mind-maps/[id]/nodes/[nodeId]/convert - Convert node to work item
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  try {
    const { id: mindMapId, nodeId } = await params
    const body = await request.json()
    const { work_item_type = 'concept', timeline = 'MVP' } = body

    // Validate work_item_type
    if (!['concept', 'feature', 'bug', 'enhancement'].includes(work_item_type)) {
      return NextResponse.json(
        { error: 'work_item_type must be concept, feature, bug, or enhancement' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the node to convert
    const { data: node, error: nodeError } = await supabase
      .from('mind_map_nodes')
      .select('*, mind_maps!inner(workspace_id, team_id)')
      .eq('id', nodeId)
      .eq('mind_map_id', mindMapId)
      .single()

    if (nodeError || !node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    // Check if already converted
    if (node.converted_to_work_item_id) {
      return NextResponse.json(
        { error: 'Node already converted to a work item' },
        { status: 400 }
      )
    }

    // Get workspace to access team_id
    const workspaceId = node.mind_maps.workspace_id
    const teamId = node.mind_maps.team_id

    // Create work item from node data
    const workItemId = Date.now().toString()
    const { data: workItem, error: workItemError } = await supabase
      .from('work_items')
      .insert({
        id: workItemId,
        team_id: teamId,
        workspace_id: workspaceId,
        name: node.title,
        type: work_item_type,
        purpose: node.description || `Converted from mind map node: ${node.title}`,
        owner: user.id,
        is_epic: false,
        parent_id: null,
        tags: [node.node_type], // Add original node type as tag
      })
      .select()
      .single()

    if (workItemError) {
      console.error('Error creating work item:', workItemError)
      return NextResponse.json(
        { error: 'Failed to create work item' },
        { status: 500 }
      )
    }

    // Optionally create timeline item if timeline is specified
    if (timeline && ['MVP', 'SHORT', 'LONG'].includes(timeline)) {
      const timelineItemId = Date.now().toString() + '1'
      const { error: timelineError } = await supabase
        .from('timeline_items')
        .insert({
          id: timelineItemId,
          work_item_id: workItemId,
          team_id: teamId,
          workspace_id: workspaceId,
          user_id: user.id,
          timeline,
          difficulty: 'medium',
          status: 'not_started',
          progress_percent: 0,
          is_blocked: false,
          blockers: [],
        })

      if (timelineError) {
        console.error('Error creating timeline item:', timelineError)
        // Continue anyway, work item is created
      }
    }

    // Update node to mark it as converted
    const { error: updateError } = await supabase
      .from('mind_map_nodes')
      .update({
        converted_to_work_item_id: workItemId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nodeId)

    if (updateError) {
      console.error('Error updating node:', updateError)
      // Rollback: Delete the work item we just created
      await supabase.from('work_items').delete().eq('id', workItemId)
      return NextResponse.json(
        { error: 'Failed to update node' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      workItem,
      node: {
        ...node,
        converted_to_work_item_id: workItemId,
      },
    })
  } catch (error: any) {
    console.error('Error in POST /api/mind-maps/[id]/nodes/[nodeId]/convert:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
