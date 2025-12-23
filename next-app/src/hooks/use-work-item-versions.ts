'use client'

/**
 * Work Item Versions Hook
 *
 * React hook for fetching and managing work item version chains.
 * Supports both enhanced items (pointing to originals) and originals
 * (being enhanced by others).
 *
 * @module hooks/use-work-item-versions
 */

import { useState, useEffect, useCallback } from 'react'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * A single version in the version chain
 */
export interface WorkItemVersion {
  /** Unique identifier */
  id: string
  /** Display title */
  title: string
  /** Work item type */
  type: string
  /** Version number (1 = original, 2+ = enhanced) */
  version: number
  /** Current phase */
  phase: string
  /** Notes explaining what changed in this version */
  version_notes?: string | null
  /** ID of the work item this enhances (null for originals) */
  enhances_work_item_id?: string | null
  /** ISO timestamp of creation */
  created_at: string
  /** Whether this is the current item being viewed */
  isCurrent?: boolean
}

/**
 * Complete version chain response
 */
export interface VersionChain {
  /** All versions in the chain, sorted by version number */
  versions: WorkItemVersion[]
  /** ID of the current work item */
  currentId: string
  /** ID of the original (version 1) work item */
  originalId: string
  /** Whether there are enhanced versions of this item */
  hasEnhancements: boolean
  /** Total number of versions */
  totalVersions: number
}

/**
 * Return type for useWorkItemVersions hook
 */
export interface UseWorkItemVersionsResult {
  /** Version chain data */
  versionChain: VersionChain | null
  /** Loading state */
  isLoading: boolean
  /** Error if fetch failed */
  error: Error | null
  /** Refetch version data */
  refetch: () => Promise<void>
  /** Whether this item has any version history */
  hasVersionHistory: boolean
}

/**
 * Props for useWorkItemVersions hook
 */
export interface UseWorkItemVersionsProps {
  /** Work item ID to fetch versions for */
  workItemId: string
  /** Current version number (if known) */
  currentVersion?: number
  /** ID of item this enhances (if known) */
  enhancesWorkItemId?: string | null
  /** Whether to fetch immediately */
  enabled?: boolean
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for fetching work item version chains
 *
 * @example
 * ```tsx
 * const { versionChain, isLoading, hasVersionHistory } = useWorkItemVersions({
 *   workItemId: workItem.id,
 *   currentVersion: workItem.version,
 *   enhancesWorkItemId: workItem.enhances_work_item_id,
 * })
 *
 * if (hasVersionHistory) {
 *   return <VersionHistory versions={versionChain.versions} />
 * }
 * ```
 */
export function useWorkItemVersions({
  workItemId,
  currentVersion = 1,
  enhancesWorkItemId,
  enabled = true,
}: UseWorkItemVersionsProps): UseWorkItemVersionsResult {
  const [versionChain, setVersionChain] = useState<VersionChain | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Determine if we need to fetch version history
  // Only fetch if:
  // - version > 1 (this is an enhanced item)
  // - enhances_work_item_id exists (this links to an original)
  // - We want to check if others have enhanced this item
  const shouldFetch = enabled && (
    currentVersion > 1 ||
    !!enhancesWorkItemId ||
    currentVersion === 1 // Check if this original has been enhanced
  )

  /**
   * Fetch version chain from API
   */
  const fetchVersions = useCallback(async () => {
    if (!workItemId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/work-items/${workItemId}/versions`)

      if (!response.ok) {
        if (response.status === 404) {
          // No versions found - item is standalone
          setVersionChain({
            versions: [],
            currentId: workItemId,
            originalId: workItemId,
            hasEnhancements: false,
            totalVersions: 1,
          })
          return
        }
        throw new Error('Failed to fetch version history')
      }

      const data = await response.json()

      // Mark current item in the chain
      const versionsWithCurrent = data.versions.map((v: WorkItemVersion) => ({
        ...v,
        isCurrent: v.id === workItemId,
      }))

      setVersionChain({
        versions: versionsWithCurrent,
        currentId: data.current_id || workItemId,
        originalId: data.original_id || workItemId,
        hasEnhancements: data.versions.length > 1,
        totalVersions: data.versions.length,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [workItemId])

  /**
   * Refetch version data
   */
  const refetch = useCallback(async () => {
    await fetchVersions()
  }, [fetchVersions])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (shouldFetch) {
      fetchVersions()
    }
  }, [shouldFetch, fetchVersions])

  // Determine if there's version history to show
  const hasVersionHistory = !!(
    versionChain &&
    (versionChain.totalVersions > 1 || currentVersion > 1 || enhancesWorkItemId)
  )

  return {
    versionChain,
    isLoading,
    error,
    refetch,
    hasVersionHistory,
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the original work item ID from a version chain
 */
export function getOriginalId(chain: VersionChain | null): string | null {
  if (!chain) return null
  return chain.originalId
}

/**
 * Get the latest version from a chain
 */
export function getLatestVersion(chain: VersionChain | null): WorkItemVersion | null {
  if (!chain || chain.versions.length === 0) return null
  return chain.versions[chain.versions.length - 1]
}

/**
 * Check if a work item can be enhanced (create new version)
 */
export function canEnhance(
  phase: string,
  type: string
): boolean {
  // Can enhance completed features or validated concepts
  const completedPhases = ['launch', 'validated', 'verified']
  return completedPhases.includes(phase)
}

export default useWorkItemVersions
