import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ConnectionType } from '@/lib/types/dependencies'

// GET /api/dependencies - List all dependencies for a workspace
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

    // Get workspace to verify access
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('team_id')
      .eq('id', workspaceId)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user has access to this workspace's team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all feature connections for this workspace
    const { data: connections, error } = await supabase
      .from('feature_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching connections:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      connections: connections || [],
      totalCount: connections?.length || 0,
    })
  } catch (error: any) {
    console.error('Error in GET /api/dependencies:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/dependencies - Create new dependency
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      workspace_id,
      source_feature_id,
      target_feature_id,
      connection_type,
      reason,
      strength = 1.0,
    } = body

    // Validation
    if (!workspace_id || !source_feature_id || !target_feature_id || !connection_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate connection type
    const validConnectionTypes: ConnectionType[] = [
      'dependency',
      'blocks',
      'enables',
      'complements',
      'conflicts',
      'relates_to',
      'duplicates',
      'supersedes',
    ]

    if (!validConnectionTypes.includes(connection_type)) {
      return NextResponse.json(
        { error: 'Invalid connection type' },
        { status: 400 }
      )
    }

    // Prevent self-connections
    if (source_feature_id === target_feature_id) {
      return NextResponse.json(
        { error: 'Cannot create dependency to itself' },
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

    // Get workspace to verify access
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('team_id')
      .eq('id', workspace_id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user has access to this workspace's team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Verify both work items exist and belong to this workspace
    const { data: sourceWorkItem } = await supabase
      .from('work_items')
      .select('id')
      .eq('id', source_feature_id)
      .eq('workspace_id', workspace_id)
      .single()

    const { data: targetWorkItem } = await supabase
      .from('work_items')
      .select('id')
      .eq('id', target_feature_id)
      .eq('workspace_id', workspace_id)
      .single()

    if (!sourceWorkItem || !targetWorkItem) {
      return NextResponse.json(
        { error: 'Source or target work item not found' },
        { status: 404 }
      )
    }

    // Check for duplicate connection
    const { data: existingConnection } = await supabase
      .from('feature_connections')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('source_feature_id', source_feature_id)
      .eq('target_feature_id', target_feature_id)
      .eq('connection_type', connection_type)
      .eq('status', 'active')
      .single()

    if (existingConnection) {
      return NextResponse.json(
        { error: 'This dependency already exists' },
        { status: 400 }
      )
    }

    // Determine if connection is bidirectional
    const bidirectionalTypes: ConnectionType[] = ['complements', 'conflicts', 'relates_to']
    const is_bidirectional = bidirectionalTypes.includes(connection_type)

    // Create connection
    const connectionId = Date.now().toString()
    const { data: connection, error } = await supabase
      .from('feature_connections')
      .insert({
        id: connectionId,
        user_id: user.id,
        workspace_id,
        source_feature_id,
        target_feature_id,
        connection_type,
        strength,
        is_bidirectional,
        reason: reason || null,
        evidence: null,
        confidence: 1.0, // User-created has 100% confidence
        discovered_by: 'user',
        status: 'active',
        user_confirmed: true,
        user_rejected: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating connection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ connection }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/dependencies:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
