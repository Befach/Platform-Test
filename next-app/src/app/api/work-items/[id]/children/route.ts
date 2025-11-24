import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/work-items/[id]/children
 * Get all children of a work item (for hierarchy display)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 })
    }

    // Verify parent work item exists and belongs to team
    const { data: parentItem, error: parentError } = await supabase
      .from('work_items')
      .select('id, name, type, is_epic')
      .eq('id', id)
      .eq('team_id', teamMember.team_id)
      .single()

    if (parentError || !parentItem) {
      return NextResponse.json(
        { error: 'Work item not found' },
        { status: 404 }
      )
    }

    // Fetch all children
    const { data: children, error: fetchError } = await supabase
      .from('work_items')
      .select('id, name, type, is_epic, parent_id, created_at, updated_at')
      .eq('parent_id', id)
      .eq('team_id', teamMember.team_id)
      .order('created_at', { ascending: true })

    if (fetchError) {
      throw fetchError
    }

    return NextResponse.json({
      parent: parentItem,
      children: children || [],
      count: children?.length || 0,
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching work item children:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch work item children' },
      { status: 500 }
    )
  }
}
