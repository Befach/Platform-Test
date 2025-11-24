import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/mind-maps - List all mind maps for a workspace
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
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

    // Get workspace to verify access and get team_id
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('team_id')
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Fetch mind maps
    const { data: mindMaps, error } = await supabase
      .from('mind_maps')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('team_id', workspace.team_id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching mind maps:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(mindMaps)
  } catch (error: any) {
    console.error('Error in GET /api/mind-maps:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/mind-maps - Create a new mind map
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workspace_id, name, description, canvas_type = 'freeform', template } = body

    if (!workspace_id || !name) {
      return NextResponse.json(
        { error: 'workspace_id and name are required' },
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

    // Get workspace to get team_id
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('team_id')
      .eq('id', workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Create mind map
    const mindMapId = Date.now().toString()
    const { data: mindMap, error: mindMapError } = await supabase
      .from('mind_maps')
      .insert({
        id: mindMapId,
        team_id: workspace.team_id,
        workspace_id,
        user_id: user.id,
        name,
        description,
        canvas_type,
        canvas_data: { zoom: 1, position: [0, 0] },
      })
      .select()
      .single()

    if (mindMapError) {
      console.error('Error creating mind map:', mindMapError)
      return NextResponse.json({ error: mindMapError.message }, { status: 500 })
    }

    // Create initial center node (only for freeform canvases)
    if (canvas_type === 'freeform') {
      const initialNodeId = Date.now().toString()
      const { error: nodeError } = await supabase
        .from('mind_map_nodes')
        .insert({
          id: initialNodeId,
          mind_map_id: mindMapId,
          team_id: workspace.team_id,
          node_type: 'idea',
          shape_type: 'semantic',
          title: name,
          description: description || undefined,
          position: { x: 250, y: 250 },
          width: 150,
          height: 100,
          data: {},
        })

      if (nodeError) {
        console.error('Error creating initial node:', nodeError)
        // Continue anyway, mind map is created
      }
    }

    return NextResponse.json(mindMap)
  } catch (error: any) {
    console.error('Error in POST /api/mind-maps:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
