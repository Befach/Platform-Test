/**
 * Work Item Enhance API Route
 *
 * Creates a new enhanced version of a work item.
 * The new version links to the original via enhances_work_item_id.
 *
 * @module api/work-items/[id]/enhance
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDefaultPhaseForType } from '@/lib/constants/workspace-phases'
import { z } from 'zod'

// Validation schema for enhance request body
const enhanceRequestSchema = z.object({
  version_notes: z.string().min(1, 'version_notes is required'),
  title: z.string().max(200).optional(),
  description: z.string().optional(),
  type: z.enum(['concept', 'feature', 'bug']).optional(),
  is_enhancement: z.boolean().optional(),
})

/**
 * POST /api/work-items/[id]/enhance
 *
 * Create a new enhanced version of a work item.
 *
 * Request body:
 * - title?: string - Optional new title (defaults to original)
 * - description?: string - Optional new description
 * - version_notes: string - Required explanation of what changed
 *
 * Returns:
 * - work_item: The newly created enhanced version
 * - previous_version: The original work item
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await req.json()

    // Validate request body with Zod
    const parseResult = enhanceRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      )
    }
    const validatedBody = parseResult.data

    // 1. Check user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch the original work item
    const { data: originalItem, error: fetchError } = await supabase
      .from('work_items')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !originalItem) {
      return NextResponse.json(
        { error: 'Work item not found' },
        { status: 404 }
      )
    }

    // 3. Verify user is member of the team (defense-in-depth)
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('team_id', originalItem.team_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Calculate the new version number
    // If this item already enhances another, find the max version in the chain
    let newVersion = (originalItem.version || 1) + 1

    // Check if there are already enhancements of this item
    const { data: existingEnhancements } = await supabase
      .from('work_items')
      .select('version')
      .eq('enhances_work_item_id', id)
      .order('version', { ascending: false })
      .limit(1)

    if (existingEnhancements && existingEnhancements.length > 0) {
      const maxExistingVersion = existingEnhancements[0].version || 1
      newVersion = Math.max(newVersion, maxExistingVersion + 1)
    }

    // 5. Determine the starting phase for the new version
    // Features start at 'design', Bugs at 'triage', Concepts at 'ideation'
    // Note: Enhancement is now a flag on features, not a separate type
    const newType = validatedBody.type || originalItem.type || 'feature'
    const startingPhase = getDefaultPhaseForType(newType as 'feature' | 'bug' | 'concept')

    // 6. Create the new enhanced work item
    const newId = Date.now().toString()
    const newTitle = validatedBody.title || originalItem.title || originalItem.name
    const newDescription = validatedBody.description ?? originalItem.description ?? originalItem.purpose

    const { data: newWorkItem, error: createError } = await supabase
      .from('work_items')
      .insert({
        id: newId,
        team_id: originalItem.team_id,
        workspace_id: originalItem.workspace_id,
        name: newTitle,
        title: newTitle,
        purpose: newDescription,
        description: newDescription,
        type: newType === 'concept' ? 'feature' : newType, // Concepts become features
        phase: startingPhase,
        version: newVersion,
        version_notes: validatedBody.version_notes,
        enhances_work_item_id: id,
        is_enhancement: validatedBody.is_enhancement ?? false, // Explicitly set enhancement flag
        // Copy relevant fields from original
        priority: originalItem.priority || 'medium',
        tags: originalItem.tags,
        department_id: originalItem.department_id,
        // Reset progress fields for new version
        progress_percent: 0,
        estimated_hours: null,
        actual_hours: null,
        target_release: null,
        actual_start_date: null,
        actual_end_date: null,
        // Carry over some context
        success_criteria: originalItem.success_criteria,
        created_by: originalItem.created_by,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating enhanced work item:', createError)
      return NextResponse.json(
        { error: 'Failed to create enhanced version' },
        { status: 500 }
      )
    }

    // 5. Copy timeline items from original (as templates)
    const { data: originalTimelines } = await supabase
      .from('timeline_items')
      .select('*')
      .eq('work_item_id', id)

    if (originalTimelines && originalTimelines.length > 0) {
      const newTimelines = originalTimelines.map((timeline) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        team_id: timeline.team_id,
        workspace_id: timeline.workspace_id,
        work_item_id: newId,
        timeline: timeline.timeline,
        scope: timeline.scope,
        status: 'not_started', // Reset status for new version
        // Clear dates for new version
        start_date: null,
        due_date: null,
      }))

      await supabase.from('timeline_items').insert(newTimelines)
    }

    return NextResponse.json({
      work_item: newWorkItem,
      previous_version: {
        id: originalItem.id,
        title: originalItem.title || originalItem.name,
        version: originalItem.version || 1,
        phase: originalItem.phase,
      },
    })
  } catch (error) {
    console.error('Error enhancing work item:', error)
    return NextResponse.json(
      { error: 'Failed to create enhanced version' },
      { status: 500 }
    )
  }
}
