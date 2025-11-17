import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// DELETE /api/mind-maps/[id]/edges/[edgeId] - Delete edge
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; edgeId: string }> }
) {
  try {
    const { id: mindMapId, edgeId } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete edge
    const { error } = await supabase
      .from('mind_map_edges')
      .delete()
      .eq('id', edgeId)
      .eq('mind_map_id', mindMapId)

    if (error) {
      console.error('Error deleting edge:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update mind map's updated_at timestamp
    await supabase
      .from('mind_maps')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', mindMapId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/mind-maps/[id]/edges/[edgeId]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
