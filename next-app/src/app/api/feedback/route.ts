import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/feedback
 * Submit feedback (public endpoint - no auth required)
 * Used by external stakeholders to provide feedback on features
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      review_link_id,
      feature_id,
      rating,
      comment,
      attachments,
      reviewer_email,
      reviewer_name,
    } = body

    // Validate required fields
    if (!review_link_id) {
      return NextResponse.json(
        { error: 'review_link_id is required' },
        { status: 400 }
      )
    }

    // Verify review link exists and is active
    const { data: reviewLink, error: linkError } = await supabase
      .from('review_links')
      .select('id, workspace_id, is_active, expires_at')
      .eq('id', review_link_id)
      .single()

    if (linkError || !reviewLink) {
      return NextResponse.json(
        { error: 'Review link not found' },
        { status: 404 }
      )
    }

    if (!reviewLink.is_active) {
      return NextResponse.json(
        { error: 'This review link is no longer active' },
        { status: 410 }
      )
    }

    // Check if link has expired
    if (reviewLink.expires_at) {
      const expiryDate = new Date(reviewLink.expires_at)
      const now = new Date()

      if (expiryDate < now) {
        return NextResponse.json(
          { error: 'This review link has expired' },
          { status: 410 }
        )
      }
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        )
      }
    }

    // Create feedback
    const id = Date.now().toString()
    const feedback = {
      id,
      review_link_id,
      feature_id: feature_id || null,
      rating: rating || null,
      comment: comment || null,
      attachments: attachments || null,
      status: 'new',
      reviewer_email: reviewer_email || null,
      reviewer_name: reviewer_name || null,
    }

    const { data: newFeedback, error: createError } = await supabase
      .from('feedback')
      .insert(feedback)
      .select()
      .single()

    if (createError) {
      throw createError
    }

    // Send notification to workspace team (optional - implement later)
    // TODO: Send email notification to workspace members

    return NextResponse.json(newFeedback, { status: 201 })
  } catch (error: any) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}
