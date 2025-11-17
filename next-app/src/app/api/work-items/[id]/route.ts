/**
 * Work Item Detail API Routes
 *
 * Individual work item operations (get, update, delete).
 * Phase-based permission enforcement on all mutations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  validatePhasePermission,
  handlePermissionError,
  logPermissionDenial,
} from '@/lib/middleware/permission-middleware'
import { calculateWorkItemPhase } from '@/lib/constants/workspace-phases'

/**
 * GET /api/work-items/[id]
 *
 * Get a single work item.
 * All team members can view all items.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Fetch work item
    const { data: workItem, error } = await supabase
      .from('work_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    // Calculate phase
    const phase = calculateWorkItemPhase(workItem)

    // Validate view permission
    await validatePhasePermission({
      workspaceId: workItem.workspace_id,
      teamId: workItem.team_id,
      phase,
      action: 'view',
    })

    return NextResponse.json({ data: workItem })
  } catch (error) {
    return handlePermissionError(error)
  }
}

/**
 * PATCH /api/work-items/[id]
 *
 * Update a work item.
 * Requires edit permission for BOTH current and target phases.
 *
 * Security considerations:
 * - If status changes, phase might change
 * - User needs edit access to both old and new phase
 * - Prevent privilege escalation by moving items between phases
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body = await req.json()

    const {
      title,
      description,
      status,
      has_timeline_breakdown,
      assigned_to,
      is_mind_map_conversion,
    } = body

    // 1. Fetch current work item
    const { data: currentItem, error: fetchError } = await supabase
      .from('work_items')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    // 2. Calculate current phase
    const currentPhase = calculateWorkItemPhase(currentItem)

    // 3. Calculate target phase after update
    const targetPhase = calculateWorkItemPhase({
      status: status ?? currentItem.status,
      has_timeline_breakdown: has_timeline_breakdown ?? currentItem.has_timeline_breakdown,
      assigned_to: assigned_to ?? currentItem.assigned_to,
      is_mind_map_conversion: is_mind_map_conversion ?? currentItem.is_mind_map_conversion,
    })

    // 4. Validate permission for CURRENT phase (can edit existing item)
    await validatePhasePermission({
      workspaceId: currentItem.workspace_id,
      teamId: currentItem.team_id,
      phase: currentPhase,
      action: 'edit',
    })

    // 5. If phase is changing, validate permission for TARGET phase too
    if (currentPhase !== targetPhase) {
      try {
        await validatePhasePermission({
          workspaceId: currentItem.workspace_id,
          teamId: currentItem.team_id,
          phase: targetPhase,
          action: 'edit',
        })
      } catch (error) {
        // Log phase escalation attempt
        const user = await supabase.auth.getUser()
        if (user.data.user) {
          logPermissionDenial({
            userId: user.data.user.id,
            action: 'phase_change',
            phase: targetPhase,
            workspaceId: currentItem.workspace_id,
            teamId: currentItem.team_id,
            reason: `Attempted to move item from ${currentPhase} to ${targetPhase} without permission`,
          })
        }

        throw error
      }
    }

    // 6. Update work item
    const { data: updatedItem, error: updateError } = await supabase
      .from('work_items')
      .update({
        title: title ?? currentItem.title,
        description: description ?? currentItem.description,
        status: status ?? currentItem.status,
        has_timeline_breakdown: has_timeline_breakdown ?? currentItem.has_timeline_breakdown,
        assigned_to: assigned_to ?? currentItem.assigned_to,
        is_mind_map_conversion: is_mind_map_conversion ?? currentItem.is_mind_map_conversion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating work item:', updateError)
      return NextResponse.json({ error: 'Failed to update work item' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedItem })
  } catch (error) {
    return handlePermissionError(error)
  }
}

/**
 * DELETE /api/work-items/[id]
 *
 * Delete a work item.
 * Requires delete permission for the item's phase.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // 1. Fetch work item
    const { data: workItem, error: fetchError } = await supabase
      .from('work_items')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !workItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    // 2. Calculate phase
    const phase = calculateWorkItemPhase(workItem)

    // 3. Validate delete permission
    await validatePhasePermission({
      workspaceId: workItem.workspace_id,
      teamId: workItem.team_id,
      phase,
      action: 'delete',
    })

    // 4. Delete work item
    const { error: deleteError } = await supabase.from('work_items').delete().eq('id', id)

    if (deleteError) {
      console.error('Error deleting work item:', deleteError)
      return NextResponse.json({ error: 'Failed to delete work item' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Work item deleted successfully' })
  } catch (error) {
    return handlePermissionError(error)
  }
}
