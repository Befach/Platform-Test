import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/mind-maps/[id]/nodes/[nodeId]/convert - Convert node to work item
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  try {
    const { id: mindMapId, nodeId } = await params
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
        description: node.description || '',
        purpose: `Converted from mind map node: ${node.title}`,
        expected_outcome: '',
        success_criteria: '',
        is_hypothesis: false,
        timeline: 'MVP', // Default to MVP, user can change later
        status: 'brainstorming',
        priority: 'medium',
        tags: [node.node_type], // Add node type as tag
        metadata: {
          converted_from_mind_map: mindMapId,
          converted_from_node: nodeId,
          original_node_type: node.node_type,
        },
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
