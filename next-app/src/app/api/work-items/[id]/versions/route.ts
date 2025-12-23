/**
 * Work Item Versions API Route
 *
 * Fetches the version chain for a work item.
 * Returns all versions (original + enhancements) linked through enhances_work_item_id.
 *
 * @module api/work-items/[id]/versions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/work-items/[id]/versions
 *
 * Get the version chain for a work item.
 * Finds all related versions by traversing enhances_work_item_id relationships.
 *
 * Returns:
 * - versions: Array of all versions, sorted by version number
 * - current_id: The ID of the requested work item
 * - original_id: The ID of the version 1 (original) work item
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 1. Fetch the current work item
    const { data: currentItem, error: currentError } = await supabase
      .from('work_items')
      .select('id, title, name, type, version, phase, version_notes, enhances_work_item_id, created_at, team_id')
      .eq('id', id)
      .single()

    if (currentError || !currentItem) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 })
    }

    // 2. Find the original (version 1) by following enhances_work_item_id chain
    let originalId = currentItem.id
    let originalItem = currentItem

    // If this item enhances another, find the original
    if (currentItem.enhances_work_item_id) {
      // Traverse up the chain to find the original
      let parentId: string | null = currentItem.enhances_work_item_id

      while (parentId) {
        const { data: parent, error: parentError } = await supabase
          .from('work_items')
          .select('id, title, name, type, version, phase, version_notes, enhances_work_item_id, created_at, team_id')
          .eq('id', parentId)
          .single()

        if (parentError || !parent) {
          break // Chain broken, use what we have
        }

        originalItem = parent
        originalId = parent.id

        if (!parent.enhances_work_item_id) {
          // Found the original (no parent)
          break
        }

        parentId = parent.enhances_work_item_id
      }
    }

    // 3. Find all versions that enhance the original (directly or indirectly)
    const versions: Array<{
      id: string
      title: string
      type: string
      version: number
      phase: string
      version_notes: string | null
      enhances_work_item_id: string | null
      created_at: string
    }> = []

    // Add the original
    versions.push({
      id: originalItem.id,
      title: originalItem.title || originalItem.name,
      type: originalItem.type,
      version: originalItem.version || 1,
      phase: originalItem.phase,
      version_notes: originalItem.version_notes,
      enhances_work_item_id: originalItem.enhances_work_item_id,
      created_at: originalItem.created_at,
    })

    // Find all items that enhance anything in our chain
    // Use a recursive approach to find all descendants
    const findEnhancements = async (parentIds: string[]) => {
      if (parentIds.length === 0) return

      const { data: enhancements, error } = await supabase
        .from('work_items')
        .select('id, title, name, type, version, phase, version_notes, enhances_work_item_id, created_at')
        .in('enhances_work_item_id', parentIds)
        .eq('team_id', currentItem.team_id)

      if (error || !enhancements || enhancements.length === 0) return

      const newIds: string[] = []
      for (const enhancement of enhancements) {
        // Avoid duplicates
        if (!versions.find((v) => v.id === enhancement.id)) {
          versions.push({
            id: enhancement.id,
            title: enhancement.title || enhancement.name,
            type: enhancement.type,
            version: enhancement.version || 1,
            phase: enhancement.phase,
            version_notes: enhancement.version_notes,
            enhances_work_item_id: enhancement.enhances_work_item_id,
            created_at: enhancement.created_at,
          })
          newIds.push(enhancement.id)
        }
      }

      // Recursively find enhancements of enhancements
      if (newIds.length > 0) {
        await findEnhancements(newIds)
      }
    }

    // Start finding enhancements from the original
    await findEnhancements([originalId])

    // 4. Sort by version number
    versions.sort((a, b) => (a.version || 1) - (b.version || 1))

    return NextResponse.json({
      versions,
      current_id: id,
      original_id: originalId,
    })
  } catch (error) {
    console.error('Error fetching work item versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch version history' },
      { status: 500 }
    )
  }
}
