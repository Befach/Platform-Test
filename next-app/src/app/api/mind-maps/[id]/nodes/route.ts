import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NodeType } from '@/lib/types/mind-map'

// POST /api/mind-maps/[id]/nodes - Create new node
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mindMapId } = await params
    const body = await request.json()
    const { node_type, title, description, position } = body

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate node type
    const validNodeTypes: NodeType[] = ['idea', 'problem', 'solution', 'feature', 'question']
    if (!validNodeTypes.includes(node_type)) {
      return NextResponse.json(
        { error: 'Invalid node type' },
        { status: 400 }
      )
    }

    // Get mind map to verify access and get team_id
    const { data: mindMap, error: mindMapError } = await supabase
      .from('mind_maps')
      .select('team_id')
      .eq('id', mindMapId)
      .single()

    if (mindMapError || !mindMap) {
      return NextResponse.json(
        { error: 'Mind map not found' },
        { status: 404 }
      )
    }

    // Create node
    const nodeId = Date.now().toString()
    const { data: node, error } = await supabase
      .from('mind_map_nodes')
      .insert({
        id: nodeId,
        mind_map_id: mindMapId,
        team_id: mindMap.team_id,
        node_type,
        title,
        description: description || null,
        position: position || { x: 250, y: 250 },
        data: {},
        style: {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating node:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update mind map's updated_at timestamp
    await supabase
      .from('mind_maps')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', mindMapId)

    return NextResponse.json({ node })
  } catch (error: any) {
    console.error('Error in POST /api/mind-maps/[id]/nodes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
