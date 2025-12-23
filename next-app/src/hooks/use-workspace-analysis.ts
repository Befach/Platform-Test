/**
 * Workspace Analysis Hook
 *
 * React hook that fetches workspace analysis data with:
 * - React Query for caching and state management
 * - Supabase real-time subscription for automatic invalidation
 * - Debounced refetch on work item changes
 *
 * @module hooks/use-workspace-analysis
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { WorkspaceAnalysis } from '@/lib/workspace/analyzer-types'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * API response shape
 */
interface AnalysisApiResponse {
  data: WorkspaceAnalysis
  meta: {
    workspaceName: string
    config: {
      staleThresholdDays: number
      upgradeReadinessThreshold: number
    }
  }
}

/**
 * Error response shape
 */
interface AnalysisApiError {
  error: string
  code: string
}

/**
 * Hook return type
 */
export interface UseWorkspaceAnalysisResult {
  /** Analysis data (null while loading or on error) */
  analysis: WorkspaceAnalysis | null
  /** Workspace name from API */
  workspaceName: string | null
  /** Whether initial fetch is in progress */
  isLoading: boolean
  /** Whether a refetch is in progress */
  isRefetching: boolean
  /** Error message if fetch failed */
  error: string | null
  /** Manually trigger a refetch */
  refetch: () => Promise<void>
  /** Last successful fetch timestamp */
  dataUpdatedAt: number | null
}

// ============================================================================
// FETCH FUNCTION
// ============================================================================

/**
 * Fetch workspace analysis from API
 */
async function fetchWorkspaceAnalysis(
  workspaceId: string,
  options?: {
    staleThreshold?: number
    upgradeThreshold?: number
  }
): Promise<AnalysisApiResponse> {
  const params = new URLSearchParams()
  if (options?.staleThreshold) {
    params.set('staleThreshold', options.staleThreshold.toString())
  }
  if (options?.upgradeThreshold) {
    params.set('upgradeThreshold', options.upgradeThreshold.toString())
  }

  const queryString = params.toString()
  const url = `/api/workspaces/${workspaceId}/analyze${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    const errorData: AnalysisApiError = await response.json().catch(() => ({
      error: 'Failed to parse error response',
      code: 'PARSE_ERROR',
    }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook for fetching and managing workspace analysis data
 *
 * Features:
 * - Automatic caching with 5-minute stale time
 * - Real-time invalidation when work items change
 * - Debounced refetch (1s) for batch changes
 * - Manual refetch capability
 *
 * @param workspaceId - ID of workspace to analyze (null to disable)
 * @param options - Optional configuration overrides
 * @returns Analysis state and controls
 *
 * @example
 * ```tsx
 * const {
 *   analysis,
 *   isLoading,
 *   error,
 *   refetch,
 * } = useWorkspaceAnalysis(workspaceId)
 *
 * if (isLoading) return <Skeleton />
 * if (error) return <ErrorDisplay message={error} />
 * if (!analysis) return null
 *
 * return <WorkspaceHealthCard analysis={analysis} onRefresh={refetch} />
 * ```
 */
export function useWorkspaceAnalysis(
  workspaceId: string | null,
  options?: {
    staleThreshold?: number
    upgradeThreshold?: number
    /** Disable real-time subscription */
    disableRealtime?: boolean
  }
): UseWorkspaceAnalysisResult {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Query key for this workspace's analysis
  const queryKey = ['workspace-analysis', workspaceId]

  // React Query for data fetching
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch: queryRefetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey,
    queryFn: () =>
      fetchWorkspaceAnalysis(workspaceId!, {
        staleThreshold: options?.staleThreshold,
        upgradeThreshold: options?.upgradeThreshold,
      }),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })

  // Debounced invalidation function
  const invalidateWithDebounce = useCallback(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer (1 second debounce for batch changes)
    debounceTimerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey })
    }, 1000)
  }, [queryClient, queryKey])

  // Subscribe to work_items changes for real-time invalidation
  useEffect(() => {
    if (!workspaceId || options?.disableRealtime) return

    const channel = supabase
      .channel(`workspace-analysis-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'work_items',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Debounced invalidation
          invalidateWithDebounce()
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [workspaceId, supabase, invalidateWithDebounce, options?.disableRealtime])

  // Manual refetch function
  const refetch = useCallback(async () => {
    await queryRefetch()
  }, [queryRefetch])

  // Extract error message
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null

  return {
    analysis: data?.data ?? null,
    workspaceName: data?.meta.workspaceName ?? null,
    isLoading,
    isRefetching: isFetching && !isLoading,
    error: errorMessage,
    refetch,
    dataUpdatedAt: dataUpdatedAt || null,
  }
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to prefetch workspace analysis
 *
 * Useful for hovering over workspace cards to prefetch before navigation
 */
export function usePrefetchWorkspaceAnalysis() {
  const queryClient = useQueryClient()

  return useCallback(
    (workspaceId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['workspace-analysis', workspaceId],
        queryFn: () => fetchWorkspaceAnalysis(workspaceId),
        staleTime: 5 * 60 * 1000,
      })
    },
    [queryClient]
  )
}

/**
 * Hook to invalidate workspace analysis cache
 *
 * Useful after bulk operations on work items
 */
export function useInvalidateWorkspaceAnalysis() {
  const queryClient = useQueryClient()

  return useCallback(
    (workspaceId?: string) => {
      if (workspaceId) {
        // Invalidate specific workspace
        queryClient.invalidateQueries({
          queryKey: ['workspace-analysis', workspaceId],
        })
      } else {
        // Invalidate all workspace analyses
        queryClient.invalidateQueries({
          queryKey: ['workspace-analysis'],
        })
      }
    },
    [queryClient]
  )
}
