'use client'

/**
 * Hook for loading work item version history
 *
 * @module hooks/use-work-item-versions
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface WorkItemVersion {
  id: string
  title: string
  version: number
  phase: string | null
  created_at: string
  is_enhancement: boolean
  enhances_work_item_id: string | null
  version_notes: string | null
}

export interface VersionChain {
  originalId: string
  versions: WorkItemVersion[]
  totalVersions: number
}

interface UseWorkItemVersionsOptions {
  workItemId: string
  currentVersion: number
  enhancesWorkItemId?: string | null
}

interface UseWorkItemVersionsReturn {
  versionChain: VersionChain | null
  isLoading: boolean
  error: string | null
  hasVersionHistory: boolean
  refetch: () => Promise<void>
}

/**
 * Check if a work item can be enhanced based on phase and type
 */
export function canEnhance(phase: string, type: string): boolean {
  // Can enhance features/enhancements in launch phase
  const enhanceableTypes = ['feature', 'enhancement']
  const launchPhase = phase === 'launch' || phase === 'complete'
  return enhanceableTypes.includes(type) && launchPhase
}

/**
 * Hook to load version history for a work item
 *
 * @example
 * ```tsx
 * const { versionChain, isLoading, hasVersionHistory } = useWorkItemVersions({
 *   workItemId: 'work_item_123',
 *   currentVersion: 2,
 *   enhancesWorkItemId: 'work_item_original'
 * })
 * ```
 */
export function useWorkItemVersions({
  workItemId,
  currentVersion,
  enhancesWorkItemId,
}: UseWorkItemVersionsOptions): UseWorkItemVersionsReturn {
  const [versionChain, setVersionChain] = useState<VersionChain | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVersions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      // Find the original work item ID (root of the version chain)
      let originalId = workItemId

      // If this is an enhancement, find the original
      if (enhancesWorkItemId) {
        // Traverse up to find the root
        let currentParent = enhancesWorkItemId
        while (currentParent) {
          const { data: parent } = await supabase
            .from('work_items')
            .select('id, enhances_work_item_id')
            .eq('id', currentParent)
            .single()

          if (parent?.enhances_work_item_id) {
            currentParent = parent.enhances_work_item_id
          } else {
            originalId = currentParent
            break
          }
        }
      }

      // Fetch all versions in the chain
      const { data: versions, error: versionsError } = await supabase
        .from('work_items')
        .select('id, name, version, phase, created_at, is_enhancement, enhances_work_item_id, version_notes')
        .or(`id.eq.${originalId},enhances_work_item_id.eq.${originalId}`)
        .order('version', { ascending: true })

      if (versionsError) {
        throw new Error('Failed to load version history')
      }

      // Also find any enhancements that point to items in this chain
      const chainIds = versions?.map(v => v.id) || []
      let allVersions = versions || []

      if (chainIds.length > 0) {
        const { data: childEnhancements } = await supabase
          .from('work_items')
          .select('id, name, version, phase, created_at, is_enhancement, enhances_work_item_id, version_notes')
          .in('enhances_work_item_id', chainIds)
          .order('version', { ascending: true })

        if (childEnhancements && childEnhancements.length > 0) {
          allVersions = [...allVersions, ...childEnhancements]
        }
      }

      // Remove duplicates and sort by version
      const uniqueVersions = Array.from(new Map(allVersions.map(v => [v.id, v])).values())
        .sort((a, b) => (a.version || 1) - (b.version || 1))

      // Map to WorkItemVersion format
      const mappedVersions: WorkItemVersion[] = uniqueVersions.map(v => ({
        id: v.id,
        title: v.name,
        version: v.version || 1,
        phase: v.phase,
        created_at: v.created_at,
        is_enhancement: v.is_enhancement || false,
        enhances_work_item_id: v.enhances_work_item_id,
        version_notes: v.version_notes,
      }))

      setVersionChain({
        originalId,
        versions: mappedVersions,
        totalVersions: mappedVersions.length,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load versions'
      setError(message)
      setVersionChain(null)
    } finally {
      setIsLoading(false)
    }
  }, [workItemId, enhancesWorkItemId])

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  const hasVersionHistory = Boolean(
    versionChain &&
    versionChain.versions.length > 1
  )

  return {
    versionChain,
    isLoading,
    error,
    hasVersionHistory,
    refetch: fetchVersions,
  }
}

export default useWorkItemVersions
