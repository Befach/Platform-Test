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
import { calculateWorkItemPhase, isValidPhaseTransition, migratePhase } from '@/lib/constants/workspace-phases'
import type { WorkspacePhase } from '@/lib/constants/workspace-phases'
import { CONCEPT_PHASES, type ConceptPhase } from '@/lib/concept/workflow'

/** Typed update payload for work items */
interface WorkItemUpdateData {
  updated_at: string
  name?: string
  purpose?: string
  type?: string
  target_release?: string | null
  acceptance_criteria?: string | null
  business_value?: string | null
  customer_impact?: string | null
  strategic_alignment?: string | null
  estimated_hours?: number | null
  priority?: string
  actual_start_date?: string | null
  actual_end_date?: string | null
  actual_hours?: number | null
  progress_percent?: number | null
  title?: string
  description?: string | null
  status?: string
  has_timeline_breakdown?: boolean
  assigned_to?: string | null
  is_mind_map_conversion?: boolean
  rejection_reason?: string | null
  archived?: boolean
  phase?: WorkspacePhase
  metadata?: Record<string, unknown>
}

/**
 * GET /api/work-items/[id]
 *
 * Get a single work item.
 * All team members can view all items.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await req.json()

    // 1. Fetch current work item
    const { data: currentItem, error: fetchError } = await supabase
      .from('work_items')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    // 2. Calculate current phase (from explicit phase field)
    const currentPhase = currentItem.phase

    // 3. Validate permission for CURRENT phase (can edit existing item)
    await validatePhasePermission({
      workspaceId: currentItem.workspace_id,
      teamId: currentItem.team_id,
      phase: currentPhase,
      action: 'edit',
    })

    // 4. Validate input fields
    // progress_percent must be 0-100 if provided
    if (body.progress_percent !== undefined) {
      const progress = Number(body.progress_percent)
      if (isNaN(progress) || progress < 0 || progress > 100) {
        return NextResponse.json(
          { error: 'progress_percent must be between 0 and 100' },
          { status: 400 }
        )
      }
    }

    // Validate rejection_reason length (10-5000 characters)
    if (body.rejection_reason !== undefined && body.rejection_reason !== null) {
      const reasonLength = body.rejection_reason.trim().length
      if (reasonLength > 0 && reasonLength < 10) {
        return NextResponse.json(
          { error: 'Rejection reason must be at least 10 characters' },
          { status: 400 }
        )
      }
      if (reasonLength > 5000) {
        return NextResponse.json(
          { error: 'Rejection reason cannot exceed 5000 characters' },
          { status: 400 }
        )
      }
    }

    // Validate concept phase transitions (if type is concept and phase is changing)
    if (currentItem.type === 'concept' && body.phase !== undefined && body.phase !== currentItem.phase) {
      // Validate both phases are valid concept phases before casting
      if (!CONCEPT_PHASES.includes(body.phase as ConceptPhase)) {
        return NextResponse.json(
          { error: `Invalid concept phase: ${body.phase}. Must be one of: ${CONCEPT_PHASES.join(', ')}` },
          { status: 400 }
        )
      }

      const { canTransitionConcept } = await import('@/lib/concept/workflow')
      const currentConceptPhase = currentItem.phase as ConceptPhase
      const targetConceptPhase = body.phase as ConceptPhase

      if (!canTransitionConcept(currentConceptPhase, targetConceptPhase)) {
        return NextResponse.json(
          {
            error: 'Invalid concept phase transition',
            allowed_transitions: ['ideation→research', 'research→validated/rejected', 'any→rejected'],
          },
          { status: 400 }
        )
      }
    }

    // 5. Prepare update data (merge with current values)
    const updateData: WorkItemUpdateData = {
      updated_at: new Date().toISOString(),
    }

    // Basic fields
    if (body.name !== undefined) updateData.name = body.name
    if (body.purpose !== undefined) updateData.purpose = body.purpose
    if (body.type !== undefined) updateData.type = body.type

    // Planning fields
    if (body.target_release !== undefined) updateData.target_release = body.target_release
    if (body.acceptance_criteria !== undefined) updateData.acceptance_criteria = body.acceptance_criteria
    if (body.business_value !== undefined) updateData.business_value = body.business_value
    if (body.customer_impact !== undefined) updateData.customer_impact = body.customer_impact
    if (body.strategic_alignment !== undefined) updateData.strategic_alignment = body.strategic_alignment
    if (body.estimated_hours !== undefined) updateData.estimated_hours = body.estimated_hours
    if (body.priority !== undefined) updateData.priority = body.priority

    // Execution fields
    if (body.actual_start_date !== undefined) updateData.actual_start_date = body.actual_start_date
    if (body.actual_end_date !== undefined) updateData.actual_end_date = body.actual_end_date
    if (body.actual_hours !== undefined) updateData.actual_hours = body.actual_hours
    if (body.progress_percent !== undefined) updateData.progress_percent = body.progress_percent

    // Legacy fields (for backward compatibility)
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.has_timeline_breakdown !== undefined) updateData.has_timeline_breakdown = body.has_timeline_breakdown
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to
    if (body.is_mind_map_conversion !== undefined) updateData.is_mind_map_conversion = body.is_mind_map_conversion

    // Concept workflow fields
    if (body.phase !== undefined) updateData.phase = body.phase
    if (body.metadata !== undefined) updateData.metadata = body.metadata
    if (body.rejection_reason !== undefined) updateData.rejection_reason = body.rejection_reason
    if (body.archived !== undefined) updateData.archived = body.archived
    if (body.review_enabled !== undefined) updateData.review_enabled = body.review_enabled
    if (body.review_status !== undefined) updateData.review_status = body.review_status

    // 6. Recalculate phase if relevant fields changed
    // Updated 2025-12-13: Always recalculate phase based on merged data
    const mergedItem = {
      ...currentItem,
      ...updateData,
      status: updateData.status ?? currentItem.status,
      has_timeline_breakdown: updateData.has_timeline_breakdown ?? currentItem.has_timeline_breakdown,
      assigned_to: updateData.assigned_to ?? currentItem.assigned_to,
      is_mind_map_conversion: updateData.is_mind_map_conversion ?? currentItem.is_mind_map_conversion,
      progress_percent: updateData.progress_percent ?? currentItem.progress_percent,
      actual_start_date: updateData.actual_start_date ?? currentItem.actual_start_date,
    }

    const newPhase = calculateWorkItemPhase(mergedItem)

    // 7. Validate phase transition if phase would change
    if (newPhase !== currentPhase) {
      // Validate transition is forward-only (or same phase)
      const migratedCurrentPhase = migratePhase(currentPhase)
      if (!isValidPhaseTransition(migratedCurrentPhase, newPhase)) {
        return NextResponse.json(
          {
            error: `Invalid phase transition from ${migratedCurrentPhase} to ${newPhase}. Phase can only move forward.`,
            current_phase: migratedCurrentPhase,
            attempted_phase: newPhase,
          },
          { status: 400 }
        )
      }

      // Validate permission for new phase
      await validatePhasePermission({
        workspaceId: currentItem.workspace_id,
        teamId: currentItem.team_id,
        phase: newPhase,
        action: 'edit',
      })

      // Update phase
      updateData.phase = newPhase
    }

    // 8. Update work item
    const { data: updatedItem, error: updateError } = await supabase
      .from('work_items')
      .update(updateData)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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
