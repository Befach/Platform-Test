import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/mind-maps/[id]/edges - Create edge (connection)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mindMapId } = await params
    const body = await request.json()
    const { source_node_id, target_node_id, edge_type, label, style } = body

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Verify both nodes exist and belong to this mind map
    const { data: sourceNode } = await supabase
      .from('mind_map_nodes')
      .select('id')
      .eq('id', source_node_id)
      .eq('mind_map_id', mindMapId)
      .single()

    const { data: targetNode } = await supabase
      .from('mind_map_nodes')
      .select('id')
      .eq('id', target_node_id)
      .eq('mind_map_id', mindMapId)
      .single()

    if (!sourceNode || !targetNode) {
      return NextResponse.json(
        { error: 'Source or target node not found' },
        { status: 404 }
      )
    }

    // Create edge
    const edgeId = `edge-${Date.now()}`
    const { data: edge, error } = await supabase
      .from('mind_map_edges')
      .insert({
        id: edgeId,
        mind_map_id: mindMapId,
        team_id: mindMap.team_id,
        source_node_id,
        target_node_id,
        edge_type: edge_type || 'default',
        label: label || null,
        style: style || {},
      })
      .select()
      .single()

    if (error) {
      // Check if it's a duplicate edge error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Connection already exists between these nodes' },
          { status: 409 }
        )
      }
      console.error('Error creating edge:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update mind map's updated_at timestamp
    await supabase
      .from('mind_maps')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', mindMapId)

    return NextResponse.json({ edge })
  } catch (error: any) {
    console.error('Error in POST /api/mind-maps/[id]/edges:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
