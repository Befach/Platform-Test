import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/review-links/by-token/[token]
 * Get a review link by token (public access - no auth required)
 * Used by external stakeholders to access review pages
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClient()
    const { token } = await params

    // Find review link by token
    const { data: reviewLink, error: linkError } = await supabase
      .from('review_links')
      .select(`
        *,
        workspaces (
          id,
          name,
          description
        )
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (linkError || !reviewLink) {
      return NextResponse.json(
        { error: 'Review link not found or expired' },
        { status: 404 }
      )
    }

    // Check if link has expired
    if (reviewLink.expires_at) {
      const expiryDate = new Date(reviewLink.expires_at)
      const now = new Date()

      if (expiryDate < now) {
        return NextResponse.json(
          { error: 'This review link has expired' },
          { status: 410 } // 410 Gone
        )
      }
    }

    // Get workspace features (work items) for this review
    const { data: workItems, error: itemsError } = await supabase
      .from('work_items')
      .select(`
        id,
        name,
        description,
        type,
        status,
        priority,
        timeline_phase,
        created_at
      `)
      .eq('workspace_id', reviewLink.workspace_id)
      .order('created_at', { ascending: false })

    if (itemsError) {
      console.error('Error fetching work items:', itemsError)
    }

    // Return review link with workspace and features
    return NextResponse.json({
      ...reviewLink,
      work_items: workItems || [],
    })
  } catch (error: any) {
    console.error('Error fetching review link by token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch review link' },
      { status: 500 }
    )
  }
}
