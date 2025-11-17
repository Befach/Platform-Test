import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ConnectionType } from '@/lib/types/dependencies'

// GET /api/dependencies/[id] - Get single dependency
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

    // Get connection
    const { data: connection, error } = await supabase
      .from('feature_connections')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('team_id')
      .eq('id', connection.workspace_id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ connection })
  } catch (error: any) {
    console.error('Error in GET /api/dependencies/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/dependencies/[id] - Update dependency
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { connection_type, reason, strength, status } = body

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing connection
    const { data: existingConnection, error: fetchError } = await supabase
      .from('feature_connections')
      .select('*, workspaces(team_id)')
      .eq('id', id)
      .single()

    if (fetchError || !existingConnection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    const teamId = (existingConnection.workspaces as any)?.team_id

    if (!teamId) {
      return NextResponse.json({ error: 'Invalid workspace' }, { status: 400 })
    }

    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate connection type if provided
    if (connection_type) {
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
    }

    // Validate status if provided
    if (status && !['active', 'inactive', 'rejected', 'pending_review'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Build updates object
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (connection_type !== undefined) {
      updates.connection_type = connection_type
      // Update bidirectional flag based on new type
      const bidirectionalTypes: ConnectionType[] = ['complements', 'conflicts', 'relates_to']
      updates.is_bidirectional = bidirectionalTypes.includes(connection_type)
    }

    if (reason !== undefined) updates.reason = reason
    if (strength !== undefined) updates.strength = strength
    if (status !== undefined) updates.status = status

    // Update connection
    const { data: connection, error } = await supabase
      .from('feature_connections')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating connection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ connection })
  } catch (error: any) {
    console.error('Error in PATCH /api/dependencies/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/dependencies/[id] - Delete dependency
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

    // Get connection to verify access
    const { data: connection, error: fetchError } = await supabase
      .from('feature_connections')
      .select('workspace_id')
      .eq('id', id)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('team_id')
      .eq('id', connection.workspace_id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete connection
    const { error } = await supabase
      .from('feature_connections')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting connection:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/dependencies/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
