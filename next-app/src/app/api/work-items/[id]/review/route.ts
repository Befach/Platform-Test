/**
 * Work Item Review API Route
 *
 * Handles review actions for work items (request, approve, reject, cancel).
 * Supports the detached review process that can block phase transitions.
 *
 * @module api/work-items/[id]/review
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  type ReviewAction,
  type ReviewStatus,
  validateReviewAction,
  getStatusAfterAction,
  type ReviewableWorkItem,
  type ReviewerRole,
} from '@/lib/phase/review-process'

/**
 * POST /api/work-items/[id]/review
 *
 * Perform a review action on a work item.
 *
 * Request body:
 * - action: 'request' | 'approve' | 'reject' | 'cancel'
 * - reason?: string - Required for reject action
 *
 * Returns:
 * - work_item: Updated work item
 * - review_status: New review status
 * - message: Action result message
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await req.json()

    // Validate request
    const action = body.action as ReviewAction
    if (!['request', 'approve', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be request, approve, reject, or cancel' },
        { status: 400 }
      )
    }

    // Rejection requires a reason
    if (action === 'reject' && (!body.reason || typeof body.reason !== 'string')) {
      return NextResponse.json(
        { error: 'Rejection requires a reason' },
        { status: 400 }
      )
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the work item
    const { data: workItem, error: fetchError } = await supabase
      .from('work_items')
      .select('*, workspace:workspace_id (team_id)')
      .eq('id', id)
      .single()

    if (fetchError || !workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    // Check team membership and get role
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', workItem.workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this team' },
        { status: 403 }
      )
    }

    const userRole = membership.role as ReviewerRole

    // Create reviewable work item for validation
    const reviewableItem: ReviewableWorkItem = {
      id: workItem.id,
      type: workItem.type,
      phase: workItem.phase,
      review_enabled: workItem.review_enabled,
      review_status: workItem.review_status,
    }

    // Validate the action
    const validation = validateReviewAction(reviewableItem, action, userRole)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Calculate new status
    const newStatus = getStatusAfterAction(action)

    // Build update object
    const updateData: Record<string, unknown> = {
      review_status: newStatus,
      updated_at: new Date().toISOString(),
    }

    // Add timestamps and reason based on action
    if (action === 'request') {
      updateData.review_requested_at = new Date().toISOString()
      updateData.review_completed_at = null
      updateData.review_reason = null
    } else if (action === 'approve' || action === 'reject') {
      updateData.review_completed_at = new Date().toISOString()
      if (action === 'reject') {
        updateData.review_reason = body.reason
      }
    } else if (action === 'cancel') {
      updateData.review_requested_at = null
      updateData.review_completed_at = null
      updateData.review_reason = null
    }

    // Update the work item
    const { data: updatedItem, error: updateError } = await supabase
      .from('work_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating work item review:', updateError)
      return NextResponse.json(
        { error: 'Failed to update review status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      work_item: updatedItem,
      review_status: newStatus as ReviewStatus | null,
      message: getActionMessage(action),
    })
  } catch (error) {
    console.error('Error processing review action:', error)
    return NextResponse.json(
      { error: 'Failed to process review action' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/work-items/[id]/review
 *
 * Toggle review_enabled for a work item.
 *
 * Request body:
 * - review_enabled: boolean
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await req.json()

    if (typeof body.review_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'review_enabled must be a boolean' },
        { status: 400 }
      )
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the work item
    const { data: workItem, error: fetchError } = await supabase
      .from('work_items')
      .select('*, workspace:workspace_id (team_id)')
      .eq('id', id)
      .single()

    if (fetchError || !workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    // Check team membership and get role
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', workItem.workspace.team_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this team' },
        { status: 403 }
      )
    }

    // Only owners and admins can toggle review
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to toggle review' },
        { status: 403 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      review_enabled: body.review_enabled,
      updated_at: new Date().toISOString(),
    }

    // If disabling review, clear review status
    if (!body.review_enabled) {
      updateData.review_status = null
      updateData.review_requested_at = null
      updateData.review_completed_at = null
      updateData.review_reason = null
    }

    // Update the work item
    const { data: updatedItem, error: updateError } = await supabase
      .from('work_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error toggling review_enabled:', updateError)
      return NextResponse.json(
        { error: 'Failed to toggle review setting' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      work_item: updatedItem,
      review_enabled: body.review_enabled,
      message: body.review_enabled
        ? 'Review process enabled'
        : 'Review process disabled',
    })
  } catch (error) {
    console.error('Error toggling review_enabled:', error)
    return NextResponse.json(
      { error: 'Failed to toggle review setting' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getActionMessage(action: ReviewAction): string {
  switch (action) {
    case 'request':
      return 'Review has been requested'
    case 'approve':
      return 'Work item has been approved'
    case 'reject':
      return 'Work item has been rejected'
    case 'cancel':
      return 'Review request has been cancelled'
    default:
      return 'Review status updated'
  }
}
