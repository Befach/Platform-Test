import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NodeType } from '@/lib/types/mind-map'

// PATCH /api/mind-maps/[id]/nodes/[nodeId] - Update node
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  try {
    const { id: mindMapId, nodeId } = await params
    const body = await request.json()
    const { node_type, title, description, position, data, style } = body

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate node type if provided
    if (node_type) {
      const validNodeTypes: NodeType[] = ['idea', 'problem', 'solution', 'feature', 'question']
      if (!validNodeTypes.includes(node_type)) {
        return NextResponse.json(
          { error: 'Invalid node type' },
          { status: 400 }
        )
      }
    }

    // Build updates object
    const updates: any = {}
    if (node_type !== undefined) updates.node_type = node_type
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (position !== undefined) updates.position = position
    if (data !== undefined) updates.data = data
    if (style !== undefined) updates.style = style
    updates.updated_at = new Date().toISOString()

    // Update node
    const { data: node, error } = await supabase
      .from('mind_map_nodes')
      .update(updates)
      .eq('id', nodeId)
      .eq('mind_map_id', mindMapId)
      .select()
      .single()

    if (error) {
      console.error('Error updating node:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update mind map's updated_at timestamp
    await supabase
      .from('mind_maps')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', mindMapId)

    return NextResponse.json({ node })
  } catch (error: any) {
    console.error('Error in PATCH /api/mind-maps/[id]/nodes/[nodeId]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/mind-maps/[id]/nodes/[nodeId] - Delete node
export async function DELETE(
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

    // Delete node (cascade will delete connected edges)
    const { error } = await supabase
      .from('mind_map_nodes')
      .delete()
      .eq('id', nodeId)
      .eq('mind_map_id', mindMapId)

    if (error) {
      console.error('Error deleting node:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update mind map's updated_at timestamp
    await supabase
      .from('mind_maps')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', mindMapId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/mind-maps/[id]/nodes/[nodeId]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
