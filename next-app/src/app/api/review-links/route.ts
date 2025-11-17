import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * GET /api/review-links?workspace_id=xxx
 * Get all review links for a workspace
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to workspace (team member)
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('team_id')
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all review links for this workspace
    const { data: reviewLinks, error: linksError } = await supabase
      .from('review_links')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (linksError) {
      throw linksError
    }

    return NextResponse.json(reviewLinks || [])
  } catch (error: any) {
    console.error('Error fetching review links:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch review links' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/review-links
 * Create a new review link
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      workspace_id,
      type,
      email,
      name,
      expires_at,
      send_email = false,
    } = body

    // Validate required fields
    if (!workspace_id || !type) {
      return NextResponse.json(
        { error: 'workspace_id and type are required' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['invite', 'public', 'embed'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: invite, public, or embed' },
        { status: 400 }
      )
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('team_id, name')
      .eq('id', workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')
    const id = Date.now().toString()

    // Create review link
    const reviewLink = {
      id,
      workspace_id,
      token,
      type,
      email: email || null,
      name: name || null,
      expires_at: expires_at || null,
      is_active: true,
      created_by: user.id,
    }

    const { data: newLink, error: createError } = await supabase
      .from('review_links')
      .insert(reviewLink)
      .select()
      .single()

    if (createError) {
      throw createError
    }

    // Send email invitation if requested and type is 'invite'
    if (send_email && type === 'invite' && email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/review-links/send-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            review_link_id: id,
            email,
            name,
            workspace_name: workspace.name,
            token,
          }),
        })
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(newLink, { status: 201 })
  } catch (error: any) {
    console.error('Error creating review link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create review link' },
      { status: 500 }
    )
  }
}
