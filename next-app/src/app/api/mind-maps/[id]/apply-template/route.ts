import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTemplateById } from '@/lib/templates/mind-map-templates'

// POST /api/mind-maps/[id]/apply-template - Apply template to mind map
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mindMapId } = await params
    const body = await request.json()
    const { template_id } = body

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the template
    const template = getTemplateById(template_id)
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
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

    // Clear existing nodes and edges (optional - for now we'll add to existing)
    // In production, you might want to ask the user if they want to replace or add

    const timestamp = Date.now()
    const nodeIdMap = new Map<string, string>() // Map template node IDs to new IDs

    // Create nodes from template
    const nodesToCreate = template.nodes.map((templateNode, index) => {
      const newNodeId = `${timestamp}-${index}`
      nodeIdMap.set(templateNode.id, newNodeId)

      return {
        id: newNodeId,
        mind_map_id: mindMapId,
        team_id: mindMap.team_id,
        node_type: templateNode.type,
        title: templateNode.title,
        description: templateNode.description,
        position: templateNode.position,
        data: {},
        style: {},
      }
    })

    const { error: nodesError } = await supabase
      .from('mind_map_nodes')
      .insert(nodesToCreate)

    if (nodesError) {
      console.error('Error creating nodes:', nodesError)
      return NextResponse.json(
        { error: 'Failed to create nodes' },
        { status: 500 }
      )
    }

    // Create edges from template
    const edgesToCreate = template.edges.map((templateEdge, index) => {
      const sourceNodeId = nodeIdMap.get(templateEdge.source)
      const targetNodeId = nodeIdMap.get(templateEdge.target)

      if (!sourceNodeId || !targetNodeId) {
        console.error('Invalid edge mapping:', templateEdge)
        return null
      }

      return {
        id: `edge-${timestamp}-${index}`,
        mind_map_id: mindMapId,
        team_id: mindMap.team_id,
        source_node_id: sourceNodeId,
        target_node_id: targetNodeId,
        edge_type: 'smoothstep',
        style: {},
      }
    }).filter(Boolean) // Remove any null entries

    if (edgesToCreate.length > 0) {
      const { error: edgesError } = await supabase
        .from('mind_map_edges')
        .insert(edgesToCreate)

      if (edgesError) {
        console.error('Error creating edges:', edgesError)
        // Don't fail the whole operation if edges fail
      }
    }

    // Update mind map's updated_at timestamp
    await supabase
      .from('mind_maps')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', mindMapId)

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
      },
      nodes_created: nodesToCreate.length,
      edges_created: edgesToCreate.length,
    })
  } catch (error: any) {
    console.error('Error in POST /api/mind-maps/[id]/apply-template:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
