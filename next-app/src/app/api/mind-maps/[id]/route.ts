import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/mind-maps/[id] - Get mind map with nodes and edges
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get mind map
    const { data: mindMap, error: mindMapError } = await supabase
      .from('mind_maps')
      .select('*')
      .eq('id', id)
      .single()

    if (mindMapError || !mindMap) {
      return NextResponse.json({ error: 'Mind map not found' }, { status: 404 })
    }

    // Get nodes
    const { data: nodes, error: nodesError } = await supabase
      .from('mind_map_nodes')
      .select('*')
      .eq('mind_map_id', id)
      .order('created_at', { ascending: true })

    if (nodesError) {
      console.error('Error fetching nodes:', nodesError)
      return NextResponse.json({ error: nodesError.message }, { status: 500 })
    }

    // Get edges
    const { data: edges, error: edgesError } = await supabase
      .from('mind_map_edges')
      .select('*')
      .eq('mind_map_id', id)
      .order('created_at', { ascending: true })

    if (edgesError) {
      console.error('Error fetching edges:', edgesError)
      return NextResponse.json({ error: edgesError.message }, { status: 500 })
    }

    return NextResponse.json({
      mindMap,
      nodes: nodes || [],
      edges: edges || [],
    })
  } catch (error: any) {
    console.error('Error in GET /api/mind-maps/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/mind-maps/[id] - Update mind map
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, canvas_data } = body

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update mind map
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (canvas_data !== undefined) updates.canvas_data = canvas_data

    const { data: mindMap, error } = await supabase
      .from('mind_maps')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating mind map:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ mindMap })
  } catch (error: any) {
    console.error('Error in PATCH /api/mind-maps/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/mind-maps/[id] - Delete mind map
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete mind map (cascade will delete nodes and edges)
    const { error } = await supabase.from('mind_maps').delete().eq('id', id)

    if (error) {
      console.error('Error deleting mind map:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/mind-maps/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
